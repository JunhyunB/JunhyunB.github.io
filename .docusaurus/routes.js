import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/junhyunb.github.io/__docusaurus/debug',
    component: ComponentCreator('/junhyunb.github.io/__docusaurus/debug', '84f'),
    exact: true
  },
  {
    path: '/junhyunb.github.io/__docusaurus/debug/config',
    component: ComponentCreator('/junhyunb.github.io/__docusaurus/debug/config', '723'),
    exact: true
  },
  {
    path: '/junhyunb.github.io/__docusaurus/debug/content',
    component: ComponentCreator('/junhyunb.github.io/__docusaurus/debug/content', 'c8c'),
    exact: true
  },
  {
    path: '/junhyunb.github.io/__docusaurus/debug/globalData',
    component: ComponentCreator('/junhyunb.github.io/__docusaurus/debug/globalData', 'ae1'),
    exact: true
  },
  {
    path: '/junhyunb.github.io/__docusaurus/debug/metadata',
    component: ComponentCreator('/junhyunb.github.io/__docusaurus/debug/metadata', 'e4a'),
    exact: true
  },
  {
    path: '/junhyunb.github.io/__docusaurus/debug/registry',
    component: ComponentCreator('/junhyunb.github.io/__docusaurus/debug/registry', '6bd'),
    exact: true
  },
  {
    path: '/junhyunb.github.io/__docusaurus/debug/routes',
    component: ComponentCreator('/junhyunb.github.io/__docusaurus/debug/routes', '4da'),
    exact: true
  },
  {
    path: '/junhyunb.github.io/blog',
    component: ComponentCreator('/junhyunb.github.io/blog', 'dbd'),
    exact: true
  },
  {
    path: '/junhyunb.github.io/blog/archive',
    component: ComponentCreator('/junhyunb.github.io/blog/archive', '486'),
    exact: true
  },
  {
    path: '/junhyunb.github.io/blog/authors',
    component: ComponentCreator('/junhyunb.github.io/blog/authors', '749'),
    exact: true
  },
  {
    path: '/junhyunb.github.io/blog/authors/all-sebastien-lorber-articles',
    component: ComponentCreator('/junhyunb.github.io/blog/authors/all-sebastien-lorber-articles', '924'),
    exact: true
  },
  {
    path: '/junhyunb.github.io/blog/authors/yangshun',
    component: ComponentCreator('/junhyunb.github.io/blog/authors/yangshun', '290'),
    exact: true
  },
  {
    path: '/junhyunb.github.io/blog/first-blog-post',
    component: ComponentCreator('/junhyunb.github.io/blog/first-blog-post', 'ccb'),
    exact: true
  },
  {
    path: '/junhyunb.github.io/blog/long-blog-post',
    component: ComponentCreator('/junhyunb.github.io/blog/long-blog-post', 'a7a'),
    exact: true
  },
  {
    path: '/junhyunb.github.io/blog/mdx-blog-post',
    component: ComponentCreator('/junhyunb.github.io/blog/mdx-blog-post', '112'),
    exact: true
  },
  {
    path: '/junhyunb.github.io/blog/tags',
    component: ComponentCreator('/junhyunb.github.io/blog/tags', 'c12'),
    exact: true
  },
  {
    path: '/junhyunb.github.io/blog/tags/docusaurus',
    component: ComponentCreator('/junhyunb.github.io/blog/tags/docusaurus', 'ff2'),
    exact: true
  },
  {
    path: '/junhyunb.github.io/blog/tags/facebook',
    component: ComponentCreator('/junhyunb.github.io/blog/tags/facebook', 'efa'),
    exact: true
  },
  {
    path: '/junhyunb.github.io/blog/tags/hello',
    component: ComponentCreator('/junhyunb.github.io/blog/tags/hello', '0f7'),
    exact: true
  },
  {
    path: '/junhyunb.github.io/blog/tags/hola',
    component: ComponentCreator('/junhyunb.github.io/blog/tags/hola', 'f1e'),
    exact: true
  },
  {
    path: '/junhyunb.github.io/blog/welcome',
    component: ComponentCreator('/junhyunb.github.io/blog/welcome', '08e'),
    exact: true
  },
  {
    path: '/junhyunb.github.io/markdown-page',
    component: ComponentCreator('/junhyunb.github.io/markdown-page', '2ba'),
    exact: true
  },
  {
    path: '/junhyunb.github.io/docs',
    component: ComponentCreator('/junhyunb.github.io/docs', 'dac'),
    routes: [
      {
        path: '/junhyunb.github.io/docs',
        component: ComponentCreator('/junhyunb.github.io/docs', '967'),
        routes: [
          {
            path: '/junhyunb.github.io/docs',
            component: ComponentCreator('/junhyunb.github.io/docs', '9ad'),
            routes: [
              {
                path: '/junhyunb.github.io/docs/category/tutorial---basics',
                component: ComponentCreator('/junhyunb.github.io/docs/category/tutorial---basics', '040'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/junhyunb.github.io/docs/category/tutorial---extras',
                component: ComponentCreator('/junhyunb.github.io/docs/category/tutorial---extras', '4d8'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/junhyunb.github.io/docs/intro',
                component: ComponentCreator('/junhyunb.github.io/docs/intro', 'fa1'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/junhyunb.github.io/docs/tutorial-basics/congratulations',
                component: ComponentCreator('/junhyunb.github.io/docs/tutorial-basics/congratulations', '334'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/junhyunb.github.io/docs/tutorial-basics/create-a-blog-post',
                component: ComponentCreator('/junhyunb.github.io/docs/tutorial-basics/create-a-blog-post', '967'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/junhyunb.github.io/docs/tutorial-basics/create-a-document',
                component: ComponentCreator('/junhyunb.github.io/docs/tutorial-basics/create-a-document', '5d0'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/junhyunb.github.io/docs/tutorial-basics/create-a-page',
                component: ComponentCreator('/junhyunb.github.io/docs/tutorial-basics/create-a-page', '0c2'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/junhyunb.github.io/docs/tutorial-basics/deploy-your-site',
                component: ComponentCreator('/junhyunb.github.io/docs/tutorial-basics/deploy-your-site', '9a0'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/junhyunb.github.io/docs/tutorial-basics/markdown-features',
                component: ComponentCreator('/junhyunb.github.io/docs/tutorial-basics/markdown-features', '9f7'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/junhyunb.github.io/docs/tutorial-extras/manage-docs-versions',
                component: ComponentCreator('/junhyunb.github.io/docs/tutorial-extras/manage-docs-versions', '189'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/junhyunb.github.io/docs/tutorial-extras/translate-your-site',
                component: ComponentCreator('/junhyunb.github.io/docs/tutorial-extras/translate-your-site', '7f9'),
                exact: true,
                sidebar: "tutorialSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/junhyunb.github.io/',
    component: ComponentCreator('/junhyunb.github.io/', 'caf'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
