import React, {type ReactNode} from 'react';
import Content from '@theme-original/DocItem/Content';
import type ContentType from '@theme/DocItem/Content';
import type {WrapperProps} from '@docusaurus/types';
import Translate from '@docusaurus/Translate';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useLocation} from '@docusaurus/router';

type Props = WrapperProps<typeof ContentType>;

/**
 * Every translated documentation page opens by saying what it is: an
 * informative translation of a normative English text.
 *
 * The documentation includes the RFCs and schema reference — the standard's
 * normative surface. A standard whose argument is "one shared vocabulary"
 * cannot afford three normative texts that can disagree, so the English
 * pages stay the single normative source and every translation says so,
 * with a link to the page it translates.
 *
 * A theme wrapper rather than a per-page banner on purpose: a hand-inserted
 * notice is a list someone forgets to extend the day a new page is
 * translated. This renders on every docs page whose locale is not the
 * default, and on no other page, with nothing to keep in sync.
 */
export default function ContentWrapper(props: Props): ReactNode {
  const {
    i18n: {currentLocale, defaultLocale},
    siteConfig: {baseUrl},
  } = useDocusaurusContext();
  const {pathname} = useLocation();

  if (currentLocale === defaultLocale) {
    return <Content {...props} />;
  }

  // The same page in the default locale: the localized URL is the default
  // URL with the locale segment inserted after the base, so removing that
  // segment is a rule, not a lookup.
  const localePrefix = `${baseUrl}${currentLocale}/`;
  const englishPath = pathname.startsWith(localePrefix)
    ? `${baseUrl}${pathname.slice(localePrefix.length)}`
    : pathname;

  return (
    <>
      <div className="theme-admonition alert alert--info margin-bottom--md" role="note">
        <Translate
          id="fds.translationNotice"
          description="Notice at the top of every translated documentation page"
          values={{
            englishPageLink: (
              <Link to={englishPath}>
                <Translate id="fds.translationNotice.linkLabel">English version</Translate>
              </Link>
            ),
          }}>
          {'This page is a translation, provided for convenience. It is informative only: the {englishPageLink} is the normative text, and where the two disagree, the English text governs.'}
        </Translate>
      </div>
      <Content {...props} />
    </>
  );
}
