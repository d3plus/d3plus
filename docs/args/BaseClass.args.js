import {formatLocale} from "d3plus-format";
import {BaseClass} from "d3plus-common";
const SampleClass = new BaseClass();

export default {
  argTypes: {

    /**
     * category: Formatting
     */
    locale: {
      type: {
        summary: "object | string"
      },
      table: {
        category: "Formatting",
        defaultValue: {
          summary: SampleClass.locale(),
          detail: JSON.stringify(formatLocale[SampleClass.locale()], null, 2),
        }
      },
      control: {
        type: "select",
        options: Object.keys(formatLocale)
      },
      description: `Sets the locale used for all text and number formatting.

The locale passed to this method can either be a locale \`object\` (internal examples [here](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js)) or a locale code matching to any of the ones defined here.

Both 4-character and 2-character codes are accepted (ex. "en" becomes "en-US").`
    },

    /**
     * category: User Interaction
     */
    on: {
      type: {
        summary: "object"
      },
      table: {
        category: "User Interaction",
        defaultValue: {
          summary: "{}"
        }
      },
      control: {type: "object"},
      description: `An \`object\` where the keys match event typenames (like "click", "mousemove", and so on) and the value at each key is a listener \`function\` that will be invoked whenever that event is fired for a given data point.

As with most Array accessor functions, the event \`function\` provided receives the current data point (\`d\`) and index (\`i\`) of that data point in the array as it's 2 arguments.`
    }
  }

}
