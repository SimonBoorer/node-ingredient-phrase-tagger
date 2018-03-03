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
            "comment": [
                ",",
                "young",
                "ones",
                "if",
                "possible"
            ],
            "name": [
                "carrots"
            ],
            "qty": [
                "1"
            ],
            "unit": [
                "pound"
            ]
        },
        {
            "comment": [
                "Kosher",
                "to",
                "taste"
            ],
            "name": [
                "salt"
            ],
            "other": [
                ","
            ]
        },
        {
            "name": [
                "sherry",
                "vinegar"
            ],
            "qty": [
                "2"
            ],
            "unit": [
                "tablespoon"
            ]
        },
        {
            "name": [
                "honey"
            ],
            "qty": [
                "2"
            ],
            "unit": [
                "tablespoon"
            ]
        },
        {
            "comment": [
                "extra-virgin"
            ],
            "name": [
                "olive",
                "oil"
            ],
            "qty": [
                "2"
            ],
            "unit": [
                "tablespoon"
            ]
        },
        {
            "comment": [
                "medium-size",
                ",",
                "peeled",
                "and",
                "finely",
                "diced"
            ],
            "name": [
                "shallot"
            ],
            "qty": [
                "1"
            ]
        },
        {
            "comment": [
                "fresh",
                ",",
                "finely",
                "chopped"
            ],
            "name": [
                "thyme",
                "leaves"
            ],
            "qty": [
                "1/2"
            ],
            "unit": [
                "teaspoon"
            ]
        },
        {
            "comment": [
                "to",
                "taste"
            ],
            "name": [
                "Black",
                "pepper"
            ],
            "other": [
                ","
            ]
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
