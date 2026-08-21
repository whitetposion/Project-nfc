-- Atomic order placement: validates stock under row locks, snapshots
-- prices, decrements inventory, inserts order + items. One transaction.
-- Called only by the Node API (service role); revoked from clients.

create or replace function create_order(
  p_user_id uuid,
  p_items jsonb,              -- [{"variant_id": uuid, "quantity": int}]
  p_shipping_address jsonb,   -- address snapshot
  p_shipping_inr integer default 0
) returns orders
language plpgsql security definer set search_path = public as $$
declare
  v_item record;
  v_variant product_variants%rowtype;
  v_subtotal integer := 0;
  v_order orders%rowtype;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ORDER';
  end if;

  -- Pass 1: lock every variant, validate product active + stock, sum subtotal.
  for v_item in
    select (e->>'variant_id')::uuid as variant_id,
           (e->>'quantity')::int    as quantity
    from jsonb_array_elements(p_items) e
  loop
    select * into v_variant
    from product_variants
    where id = v_item.variant_id
    for update;                       -- row lock: concurrent buyers serialize here

    if not found then
      raise exception 'VARIANT_NOT_FOUND:%', v_item.variant_id;
    end if;

    if not exists (
      select 1 from products p
      where p.id = v_variant.product_id and p.status = 'active'
    ) then
      raise exception 'PRODUCT_INACTIVE:%', v_item.variant_id;
    end if;

    if v_variant.inventory < v_item.quantity then
      raise exception 'INSUFFICIENT_STOCK:%', v_item.variant_id;
    end if;

    v_subtotal := v_subtotal + v_variant.price_inr * v_item.quantity;
  end loop;

  insert into orders (user_id, status, subtotal_inr, shipping_inr, total_inr, shipping_address)
  values (p_user_id, 'pending', v_subtotal, p_shipping_inr,
          v_subtotal + p_shipping_inr, p_shipping_address)
  returning * into v_order;

  -- Pass 2: snapshot unit prices into items, decrement stock.
  for v_item in
    select (e->>'variant_id')::uuid as variant_id,
           (e->>'quantity')::int    as quantity
    from jsonb_array_elements(p_items) e
  loop
    select * into v_variant from product_variants where id = v_item.variant_id;

    insert into order_items (order_id, variant_id, quantity, unit_price_inr)
    values (v_order.id, v_item.variant_id, v_item.quantity, v_variant.price_inr);

    update product_variants
    set inventory = inventory - v_item.quantity
    where id = v_item.variant_id;
  end loop;

  return v_order;
end; $$;

-- Service role only. Clients must go through the API.
revoke execute on function create_order(uuid, jsonb, jsonb, integer)
  from public, anon, authenticated;
