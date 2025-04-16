import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Paper Reviews',
    Svg: require('@site/static/img/paper_reviews.svg').default,
    description: (
      <>
        Detailed summaries and analyses of research papers in Computer Vision, 
        Machine Learning, and Natural Language Processing.
      </>
    ),
    link: '/docs/intro',
  },
  {
    title: 'Research Notes',
    Svg: require('@site/static/img/research_notes.svg').default,
    description: (
      <>
        Blog posts about research topics, experiments, and interesting findings 
        from my academic journey.
      </>
    ),
    link: '/blog',
  },
  {
    title: 'About Me',
    Svg: require('@site/static/img/about_me.svg').default,
    description: (
      <>
        Learn more about my background, research interests, and academic pursuits.
      </>
    ),
    link: '/about',
  },
];

function Feature({Svg, title, description, link}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
        <div className={styles.buttons}>
          <a className="button button--secondary button--sm" href={link}>
            Learn More
          </a>
        </div>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
