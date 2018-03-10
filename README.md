# CRF Ingredient Phrase Tagger

NodeJS port of NYTimes [CRF Ingredient Phrase Tagger](https://github.com/NYTimes/ingredient-phrase-tagger).

This repo contains scripts to extract the Quantity, Unit, Name, and Comments
from unstructured ingredient phrases. Given the following input:

    1 pound carrots, young ones if possible
    Kosher salt, to taste
    2 tablespoons sherry vinegar
    2 tablespoons honey
    2 tablespoons extra-virgin olive oil
    1 medium-size shallot, peeled and finely diced
    1/2 teaspoon fresh thyme leaves, finely chopped
    Black pepper, to taste

This tool produces something like:

    [
        {
            "qty": "1",
            "unit": "pound",
            "name": "carrots",
            "comment": ", young ones if possible",
            "display": "<span class='qty'>1<\/span><span class='unit'>pound<\/span><span class='name'>carrots<\/span><span class='comment'>, young ones if possible<\/span>",
            "input": "1 pound carrots, young ones if possible"
        },
        {
            "comment": "Kosher to taste",
            "name": "salt",
            "other": ",",
            "display": "<span class='comment'>Kosher<\/span><span class='name'>salt<\/span><span class='other'>,<\/span><span class='comment'>to taste<\/span>",
            "input": "Kosher salt, to taste"
        },
        {
            "qty": "2",
            "unit": "tablespoon",
            "name": "sherry vinegar",
            "display": "<span class='qty'>2<\/span><span class='unit'>tablespoons<\/span><span class='name'>sherry vinegar<\/span>",
            "input": "2 tablespoons sherry vinegar"
        },
        {
            "qty": "2",
            "unit": "tablespoon",
            "name": "honey",
            "display": "<span class='qty'>2<\/span><span class='unit'>tablespoons<\/span><span class='name'>honey<\/span>",
            "input": "2 tablespoons honey"
        },
        {
            "qty": "2",
            "unit": "tablespoon",
            "comment": "extra-virgin",
            "name": "olive oil",
            "display": "<span class='qty'>2<\/span><span class='unit'>tablespoons<\/span><span class='comment'>extra-virgin<\/span><span class='name'>olive oil<\/span>",
            "input": "2 tablespoons extra-virgin olive oil"
        },
        {
            "qty": "1",
            "comment": "medium-size, peeled and finely diced",
            "name": "shallot",
            "display": "<span class='qty'>1<\/span><span class='comment'>medium-size<\/span><span class='name'>shallot<\/span><span class='comment'>, peeled and finely diced<\/span>",
            "input": "1 medium-size shallot, peeled and finely diced"
        },
        {
            "qty": "1\/2",
            "unit": "teaspoon",
            "comment": "fresh, finely chopped",
            "name": "thyme leaves",
            "display": "<span class='qty'>1\/2<\/span><span class='unit'>teaspoon<\/span><span class='comment'>fresh<\/span><span class='name'>thyme leaves<\/span><span class='comment'>, finely chopped<\/span>",
            "input": "1\/2 teaspoon fresh thyme leaves, finely chopped"
        },
        {
            "name": "Black pepper",
            "other": ",",
            "comment": "to taste",
            "display": "<span class='name'>Black pepper<\/span><span class='other'>,<\/span><span class='comment'>to taste<\/span>",
            "input": "Black pepper, to taste"
        }
    ]

## Usage

### Training

    import path from "path";

    import { Trainer } from "ingredient-phrase-tagger";

    const trainer = new Trainer();

    const data_path = path.join(__dirname, "nyt-ingredients-snapshot-2015.csv");
    const model_filename = path.join(__dirname, "model.crfsuite");

    trainer.append(data_path, 20000, 0).then(() => {
        trainer.train(model_filename);
    });
    
    // output: ./model.crfsuite

### Testing

    import path from "path";

    import { Tagger } from "ingredient-phrase-tagger";

    const tagger = new Tagger();

    const model_filename = path.join(__dirname, "model.crfsuite");

    const is_opened = tagger.open(model_filename);
    console.log("File model is opened:", is_opened);

    const input = [
        "1 pound carrots, young ones if possible",
        "Kosher salt, to taste",
        "2 tablespoons sherry vinegar",
        "2 tablespoons honey",
        "2 tablespoons extra-virgin olive oil",
        "1 medium-size shallot, peeled and finely diced",
        "1/2 teaspoon fresh thyme leaves, finely chopped",
        "Black pepper, to taste"
    ];

    const data = tagger.tag(input);
