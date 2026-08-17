import type { Config } from "@measured/puck";
import { themePresets } from "@gifting/ui";
import { Paragraph, paragraphFields } from "./blocks/Paragraph";

// M3: add HeroImage, Gallery, VoiceNote, BackgroundMusic here.
export const config: Config = {
  root: {
    fields: {
      background: {
        type: "select",
        options: [...themePresets.backgrounds]
      }
    },
    render: ({ children }) => <div>{children}</div>
  },
  components: {
    Paragraph: {
      fields: paragraphFields,
      render: Paragraph
    }
  }
};
