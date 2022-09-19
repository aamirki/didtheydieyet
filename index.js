const header = window.document.getElementById('header');
const answer = window.document.getElementById('answer');
const searchLabel = window.document.getElementById('searchLabel');
const searchInput = window.document.getElementById('search');

searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const url = new URL(window.document.location.href);
    const searchValue = searchInput.value;
    url.searchParams.set('arg', searchValue);
    history.pushState(null, '', url);
    initialize(searchValue);
  }
});

initialize(new URL(window.document.location.href).searchParams.get('arg'));

// initialize sets the text on the page after attempting to determine
// whether or not [queryArg] is alive or dead.
async function initialize(queryArg) {
  if (queryArg) {
    const wikipediaResult = await getWikipediaResult(queryArg);
    if (!wikipediaResult.error) {
      const deadResult = getDeadResult(wikipediaResult.summary);
      if (deadResult.unknown) {
        answer.textContent = 'Maybe…';
      } else if (deadResult.isDead) {
        answer.textContent = 'Yes';
      } else {
        answer.textContent = 'No';
      }
    } else {
      answer.textContent = 'Who Knows…';
    }
    header.textContent = `Did ${properCase(queryArg)} Die Yet?`
    searchLabel.textContent = 'Search for Another:';
  }
}

// getDeadResult returns whether or not the given [summary] describes a noun
// that is dead or live. It does this by determining whether the word "was"
// appears before the word "is."
function getDeadResult(summary) {
  const stringToSearch = summary.toLowerCase();
  const wasIndex = stringToSearch.indexOf(' was ');
  const isIndex = stringToSearch.indexOf(' is ');
  if (wasIndex !== -1 && isIndex !== -1) {
    return {
      unknown: false,
      isDead: wasIndex < isIndex,
    };
  } else if (wasIndex !== -1) {
    return {
      unknown: false,
      isDead: true,
    };
  } else if (isIndex !== -1) {
    return {
      unknown: false,
      isDead: false,
    }
  } else {
    return {
      unknown: true,
    };
  }
}

// getWikipediaResults retrieves the wikipedia summary for the given [argName],
// and attempts to extract the summary string. Returns a result in the form
// { error: boolean, summary: string } where error is true if no article exists
// with the given [argName] or there were any other errors fetching the data
// from the Wikipedia API.
async function getWikipediaResult(argName) {
  const formattedArgName = properCase(argName).replaceAll(' ', '_');
  try {
    const article = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${formattedArgName}`,
    );
    const articleJSON = await article.json();
    if (articleJSON?.extract) {
      return {
        error: false,
        summary: articleJSON.extract,
      };
    }
  } catch {}
  return { error: true };
}

// properCase returns the given [argName] with the first letter
// of each word within it with an uppercase letter.
function properCase(argName) {
  const splitNames = argName.split(' ');
  const uppercasedSplitNames = splitNames.map((name) => {
    if (name?.length > 1) {
      return `${name[0].toUpperCase()}${name.substring(1)}`; 
    }
    return name;
  });
  let properName = '';
  uppercasedSplitNames.forEach((name) => {
    if (name) {
      properName = properName + ` ${name}`;
    }
  });
  return properName;
}
