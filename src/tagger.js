import crfsuite from "crfsuite";

import { import_data, export_data } from "./utils";

class Tagger {
  constructor() {
    this.tagger = new crfsuite.Tagger();
  }

  open(model_filename) {
    return this.tagger.open(model_filename);
  }

  close() {
    return this.tagger.close();
  }

  tag(input) {
    const data = export_data(input);

    const instances = data.map(xseq => {
      const yseq = this.tagger.tag(xseq);
      return [xseq, yseq];
    });

    return import_data(instances);
  }
}

export default Tagger;
