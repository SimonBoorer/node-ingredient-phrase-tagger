import inflection from "inflection";

export const tokenize = s => {
  /*
  Tokenize on parenthesis, punctuation, spaces and American units followed by a slash.
  We sometimes give American units and metric units for baking recipes. For example:
    * 2 tablespoons/30 mililiters milk or cream
    * 2 1/2 cups/300 grams all-purpose flour
  The recipe database only allows for one unit, and we want to use the American one.
  But we must split the text on "cups/" etc. in order to pick it up.
  */

  const american_units = [
    "cup",
    "tablespoon",
    "teaspoon",
    "pound",
    "ounce",
    "quart",
    "pint"
  ];
  for (const unit of american_units) {
    s = s.replace(unit + "/", unit + " ");
    s = s.replace(unit + "s/", unit + "s ");
  }

  return clumpFractions(s).split(/(?=[,()])|\s+/);
};

export const clumpFractions = s => {
  /*
  Replaces the whitespace between the integer and fractional part of a quantity
  with a dollar sign, so it's interpreted as a single token. The rest of the
  string is left alone.
    clumpFractions("aaa 1 2/3 bbb")
    # => "aaa 1$2/3 bbb"
  */
  return s.replace(/(\d+)\s+(\d)\/(\d)/, "$1$$$2/$3");
};

export const cleanUnicodeFractions = s => {
  const fractions = {
    "\u215b": "1/8",
    "\u215c": "3/8",
    "\u215d": "5/8",
    "\u215e": "7/8",
    "\u2159": "1/6",
    "\u215a": "5/6",
    "\u2155": "1/5",
    "\u2156": "2/5",
    "\u2157": "3/5",
    "\u2158": "4/5",
    "\u00bc": "1/4",
    "\u00be": "3/4",
    "\u2153": "1/3",
    "\u2154": "2/3",
    "\u00bd": "1/2"
  };

  for (const [f_unicode, f_ascii] of Object.entries(fractions)) {
    s = s.replace(f_unicode, f_ascii);
  }

  return s;
};

export const unclump = s => {
  return s.replace("$", " ");
};

export const normalizeToken = s => {
  return inflection.singularize(s);
};

export const getFeatures = (token, index, tokens) => {
  const length = tokens.length;

  return [
    `I${index}`,
    `L${lengthGroup(length)}`,
    (isCapitalized(token) ? "Yes" : "No") + "CAP",
    (insideParenthesis(token, tokens) ? "Yes" : "No") + "PAREN"
  ];
};

export const isCapitalized = token => {
  /*
  Returns true if a given token starts with a capital letter.
  */
  return /^[A-Z]/.test(token);
};

export const lengthGroup = actualLength => {
  /*
  Buckets the length of the ingredient into 6 buckets.
  */
  for (const n of [4, 8, 12, 16, 20]) {
    if (actualLength < n) {
      return n.toString();
    }
  }

  return "X";
};

const escapeRegExp = string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
};

export const insideParenthesis = (token, tokens) => {
  if (["(", ")"].includes(token)) {
    return true;
  } else {
    const line = tokens.join(" ");
    return new RegExp(`.*\\(.*${escapeRegExp(token)}.*\\).*`).test(line);
  }
};

const displayIngredient = ingredient => {
  /*
  Format a list of (tag, [tokens]) tuples as an HTML string for display.

      displayIngredient([("qty", ["1"]), ("name", ["cat", "pie"])])
      # => <span class='qty'>1</span> <span class='name'>cat pie</span>
  */

  return ingredient
    .map(([tag, tokens]) => {
      return `<span class='${tag}'>${tokens.join(" ")}</span>`;
    })
    .join("");
};

// HACK: fix this
const smartJoin = words => {
  /*
  Joins list of words with spaces, but is smart about not adding spaces
  before commas.
  */

  let input = words.join(" ");

  // replace " , " with ", "
  input = input.replace(" , ", ", ");

  // replace " ( " with " ("
  input = input.replace("( ", "(");

  // replace " ) " with ") "
  input = input.replace(" )", ")");

  return input;
};

export const import_data = instances => {
  const data = [];
  const display = [];
  for (const [xseq, yseq] of instances) {
    const ingredientData = {};
    const ingredientDisplay = [];
    let prevTag = null;

    xseq.forEach(([token, ...features], i) => {
      // unclump fractions
      token = unclump(token);

      // turn B-NAME/123 back into "name"
      let tag = yseq[i];
      tag = tag.replace(/^[BI]-/, "").toLowerCase();

      // ---- DISPLAY ----
      // build a structure which groups each token by its tag, so we can
      // rebuild the original display name later.

      if (prevTag !== tag) {
        ingredientDisplay.push([tag, [token]]);
        prevTag = tag;
      } else {
        ingredientDisplay[ingredientDisplay.length - 1][1].push(token);
      }

      // ---- DATA ----
      // build a dict grouping tokens by their tag

      // initialize this attribute if this is the first token of its kind
      ingredientData[tag] = ingredientData[tag] || [];

      // HACK: If this token is a unit, singularize it so Scoop accepts it.
      if (tag === "unit") {
        token = inflection.singularize(token);
      }

      ingredientData[tag].push(token);
    });

    data.push(ingredientData);
    display.push(ingredientDisplay);
  }

  // reassemble the output into a list of dicts.
  const output = data.map(ingredient => {
    return Object.keys(ingredient).reduce((accumulator, tag) => {
      accumulator[tag] = smartJoin(ingredient[tag]);
      return accumulator;
    }, {});
  });

  // Add the marked-up display data
  for (const i of output.keys()) {
    output[i]["display"] = displayIngredient(display[i]);
  }

  // Add the raw ingredient phrase
  for (const i of output.keys()) {
    output[i]["input"] = smartJoin(
      display[i].map(([tag, tokens]) => tokens.join(" "))
    );
  }

  return output;
};

export const export_data = lines => {
  /*
  Parse "raw" ingredient lines into CRF-ready output
  */
  return lines.map(line => {
    const line_clean = line.replace(/<[^<]+?>/, "");
    const tokens = tokenize(line_clean);

    return tokens.map((token, i) => {
      const features = getFeatures(token, i + 1, tokens);
      return [token, ...features];
    });
  });
};
