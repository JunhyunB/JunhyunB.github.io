import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            Paper Summaries
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Paper Summaries and Research Notes">
      <HomepageHeader />
      <main>
        <div className="container margin-vert--xl">
          <div className="row">
            <div className="col col--8 col--offset-2">
              <div className="text--center margin-bottom--lg">
                <Heading as="h2">Research Areas</Heading>
              </div>
              <div className="row">
                <div className="col col--4">
                  <div className="card">
                    <div className="card__header">
                      <h3>Computer Vision</h3>
                    </div>
                    <div className="card__body">
                      <p>Object detection, segmentation, generation, and more</p>
                    </div>
                    <div className="card__footer">
                      <Link className="button button--primary" to="/docs/computer-vision">
                        Browse
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col col--4">
                  <div className="card">
                    <div className="card__header">
                      <h3>Machine Learning</h3>
                    </div>
                    <div className="card__body">
                      <p>Deep learning, reinforcement learning, and more</p>
                    </div>
                    <div className="card__footer">
                      <Link className="button button--primary" to="/docs/machine-learning">
                        Browse
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col col--4">
                  <div className="card">
                    <div className="card__header">
                      <h3>NLP</h3>
                    </div>
                    <div className="card__body">
                      <p>Language models, transformers, and more</p>
                    </div>
                    <div className="card__footer">
                      <Link className="button button--primary" to="/docs/nlp">
                        Browse
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
