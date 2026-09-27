import NYT from '../../src/adapters/nyt.js';
import WaPos from '../../src/adapters/wapos.js';
import Bloomberg from '../../src/adapters/bloomberg.js';
import Reuters from '../../src/adapters/reuters.js';
import Economist from '../../src/adapters/economist.js';
import Medium from '../../src/adapters/medium.js';

export const siteCases = [
    {
        adapter: NYT, domain: 'nytimes.com',
        article: 'https://www.nytimes.com/2026/09/23/world/first.html',
        otherArticle: 'https://www.nytimes.com/2026/09/23/world/second.html'
    },
    {
        adapter: WaPos, domain: 'washingtonpost.com',
        article: 'https://www.washingtonpost.com/world/2026/09/23/first/',
        otherArticle: 'https://www.washingtonpost.com/world/2026/09/23/second/'
    },
    {
        adapter: Bloomberg, domain: 'bloomberg.com',
        article: 'https://www.bloomberg.com/news/articles/2026-09-23/first',
        otherArticle: 'https://www.bloomberg.com/news/articles/2026-09-23/second'
    },
    {
        adapter: Reuters, domain: 'reuters.com', zIndex: 100,
        article: 'https://www.reuters.com/world/first-2026-09-23/',
        otherArticle: 'https://www.reuters.com/world/second-2026-09-23/'
    },
    {
        adapter: Economist, domain: 'economist.com', zIndex: 100, draft: true,
        article: 'https://www.economist.com/world/first-2026-09-23/',
        otherArticle: 'https://www.economist.com/world/second-2026-09-23/'
    },
    { adapter: Medium, domain: 'medium.com', zIndex: 488 }
];

export const newsCases = siteCases.filter(({ article }) => article);
export const articleCases = newsCases.filter(({ draft }) => !draft);
