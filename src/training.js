import fs from "fs";
import csv from "csv";

import * as utils from "./utils";

const generateDataStream = (data_path, count, offset) => {
  const parser = csv.parse({
    auto_parse: true,
    columns: true,
    from: offset,
    to: offset + count
  });

  const transformer = csv.transform(row => {
    // extract the display name
    const display_input = utils.cleanUnicodeFractions(row.input);
    const tokens = utils.tokenize(display_input);
    delete row.input;

    const rowData = addPrefixes(tokens.map(t => [t, matchUp(t, row)]));

    const xseq = rowData.map(([token, tags], i) => {
      const features = utils.getFeatures(token, i + 1, tokens);
      return [token, ...features];
    });
    const yseq = rowData.map(([token, tags]) => bestTag(tags));
    return [xseq, yseq];
  });

  return fs
    .createReadStream(data_path)
    .pipe(parser)
    .pipe(transformer);
};

const parseNumbers = s => {
  /*
  Parses a string that represents a number into a decimal data type so that
  we can match the quantity field in the db with the quantity that appears
  in the display name. Rounds the result to 2 places.
  */
  const ss = utils.unclump(s);

  const m3 = ss.match(/^\d+$/);
  if (m3) {
    return Number(Math.round(parseFloat(ss) + "e2") + "e-2");
  }

  const m1 = ss.match(/(\d+)\s(\d)\/(\d)/);
  if (m1) {
    const num = parseInt(m1[1], 10) + parseFloat(m1[2]) / parseFloat(m1[3]);
    return Number(Math.round(num + "e2") + "e-2");
  }

  const m2 = ss.match(/^(\d)\/(\d)$/);
  if (m2) {
    const num = parseFloat(m2[1]) / parseFloat(m2[2]);
    return Number(Math.round(num + "e2") + "e-2");
  }

  return null;
};

const matchUp = (token, ingredientRow) => {
  /*
  Returns our best guess of the match between the tags and the
  words from the display text.

  This problem is difficult for the following reasons:
      * not all the words in the display name have associated tags
      * the quantity field is stored as a number, but it appears
        as a string in the display name
      * the comment is often a compilation of different comments in
        the display name
  */
  const ret = [];

  token = utils.normalizeToken(token);
  const decimalToken = parseNumbers(token);

  for (const [key, val] of Object.entries(ingredientRow)) {
    if (typeof val === "string" || val instanceof String) {
      for (const vt of utils.tokenize(val)) {
        if (utils.normalizeToken(vt) === token) {
          ret.push(key.toUpperCase());
        }
      }
    } else if (decimalToken !== null) {
      if (val === decimalToken) {
        ret.push(key.toUpperCase());
      }
    }
  }

  return ret;
};

const addPrefixes = data => {
  /*
  We use BIO tagging/chunking to differentiate between tags
  at the start of a tag sequence and those in the middle. This
  is a common technique in entity recognition.

  Reference: http://www.kdd.cis.ksu.edu/Courses/Spring-2013/CIS798/Handouts/04-ramshaw95text.pdf
  */
  let prevTags = null;
  const newData = [];

  for (const [token, tags] of data) {
    const newTags = [];

    for (const t of tags) {
      const p = prevTags === null || !prevTags.includes(t) ? "B" : "I";
      newTags.push(`${p}-${t}`);
    }

    newData.push([token, newTags]);
    prevTags = tags;
  }

  return newData;
};

const bestTag = tags => {
  if (tags.length === 1) {
    return tags[0];
  } else {
    // if there are multiple tags, pick the first which isn't COMMENT
    for (const t of tags) {
      if (t !== "B-COMMENT" && t !== "I-COMMENT") {
        return t;
      }
    }
  }

  // we have no idea what to guess
  return "OTHER";
};

export default generateDataStream;
