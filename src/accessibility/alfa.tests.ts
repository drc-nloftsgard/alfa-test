import { Awaiter, Scraper, Screenshot } from '@siteimprove/alfa-scraper';
import { Audit, Outcome, Rule } from '@siteimprove/alfa-act';
import { Rules } from '@siteimprove/alfa-rules';
import { Iterable } from '@siteimprove/alfa-iterable';
import { Timeout } from '@siteimprove/alfa-time';
import { Page } from '@siteimprove/alfa-web';

import * as path from 'path';


async function runTests(name: string, url: string) {

  let outputDir = path.join(__dirname, `alfa-${name}.png`);

  const scraper = await Scraper.of();

  scraper
    .scrape(url, {
      awaiter: Awaiter.duration(3000),
      screenshot: Screenshot.of(outputDir),
      timeout: Timeout.of(20000),
    })
    .then( result => {

      if (result.isErr()) {
        throw result.getErr();
      } else {
        const page = result.get();

        if (page.response.status !== 200) {
          throw Error('page did not respond with 200 OK');
        } else {
          return page;
        }
      }
    })
    .then( (page: Page) => {

      const reducedAudit = Rules.reduce(
        (audit: Audit<Page>, rule: Rule<Page, any, any>) => {
          return audit.add(rule);
        },
        Audit.of(page)
      );

      return reducedAudit.evaluate().then( (outcomes: Iterable<Outcome<Page, any, any>>) => {

        // getting 'inapplicable' for every outcome
        for (const outcome of outcomes) {

          console.log('outcome', outcome.toJSON());

        }

        // const json = [...outcomes].map(outcome => {
        //   return Outcome.isApplicable(outcome) ? outcome.toJSON() : null;
        // });
        // console.log('JSON', json);

        return outcomes;
      });
    })
    .catch(e => {
      console.error(e);
      return scraper.close();
    })
    .then(() => {
      return scraper.close();
    });
}

runTests('drc.com', 'https://www.datarecognitioncorp.com/');
// runTests('components-lib', 'http://drc-app-ux-dev.drcedirect.com');
// runTests('portal-v2', 'https://www.drcedirect.com/all/eca-portal-v2-ui');
