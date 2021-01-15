const util = {
   /* This helper detects certain keywords to convert something like this:
      Ingredients
      Butter
      Ginger
      Steps
      Pre-heat something
      Pray
    into
      {
        "ingredients": ["Butter", "Ginger"],
        "steps": ["Pre-heat something", "Pray"]
      }
  */
  textToRecipeObject: (text) => {
    const keywords=["title", "ingredients", "steps"]
    const lines = text.split("\n")

    const result = {}
    let currKeyword = '';

    for (var i = 0; i < lines.length; i++) {
        const line= lines[i].toLowerCase().trim();
        if (keywords.includes(line)) {
            currKeyword = line;
        } else if (currKeyword && lines[i]) {
            result[currKeyword] = result[currKeyword] ? result[currKeyword].concat(lines[i]) : [lines[i]]
        }
    }

    return result;
  }
}

module.exports = util;
