import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '5ff'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '5ba'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a2b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'c3c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '156'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '88c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '000'),
    exact: true
  },
  {
    path: '/about',
    component: ComponentCreator('/about', 'c49'),
    exact: true
  },
  {
    path: '/blog',
    component: ComponentCreator('/blog', 'bb4'),
    exact: true
  },
  {
    path: '/blog/2025/04/16/blog-post',
    component: ComponentCreator('/blog/2025/04/16/blog-post', '4c0'),
    exact: true
  },
  {
    path: '/blog/archive',
    component: ComponentCreator('/blog/archive', '182'),
    exact: true
  },
  {
    path: '/blog/authors',
    component: ComponentCreator('/blog/authors', '0b7'),
    exact: true
  },
  {
    path: '/blog/tags',
    component: ComponentCreator('/blog/tags', '287'),
    exact: true
  },
  {
    path: '/blog/tags/test',
    component: ComponentCreator('/blog/tags/test', '5eb'),
    exact: true
  },
  {
    path: '/search',
    component: ComponentCreator('/search', '822'),
    exact: true
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', '53d'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', '63d'),
        routes: [
          {
            path: '/docs/tags',
            component: ComponentCreator('/docs/tags', 'fce'),
            exact: true
          },
          {
            path: '/docs/tags/sample',
            component: ComponentCreator('/docs/tags/sample', '268'),
            exact: true
          },
          {
            path: '/docs/tags/template',
            component: ComponentCreator('/docs/tags/template', '1dd'),
            exact: true
          },
          {
            path: '/docs/tags/test',
            component: ComponentCreator('/docs/tags/test', 'e13'),
            exact: true
          },
          {
            path: '/docs',
            component: ComponentCreator('/docs', 'ea2'),
            routes: [
              {
                path: '/docs/intro',
                component: ComponentCreator('/docs/intro', '61d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/mechanistic-interpretability/',
                component: ComponentCreator('/docs/mechanistic-interpretability/', 'b8b'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/mechanistic-interpretability/another-sample',
                component: ComponentCreator('/docs/mechanistic-interpretability/another-sample', '810'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/mechanistic-interpretability/sample-paper',
                component: ComponentCreator('/docs/mechanistic-interpretability/sample-paper', '710'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/mechanistic-interpretability/test',
                component: ComponentCreator('/docs/mechanistic-interpretability/test', '7e2'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/paper-review-template',
                component: ComponentCreator('/docs/paper-review-template', 'fc6'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/trustworthy-ai/',
                component: ComponentCreator('/docs/trustworthy-ai/', '04f'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/trustworthy-ai/diffusion-based/',
                component: ComponentCreator('/docs/trustworthy-ai/diffusion-based/', 'a66'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/trustworthy-ai/diffusion-based/safety-guidance',
                component: ComponentCreator('/docs/trustworthy-ai/diffusion-based/safety-guidance', '2b0'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/trustworthy-ai/diffusion-based/test2',
                component: ComponentCreator('/docs/trustworthy-ai/diffusion-based/test2', 'def'),
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
    path: '/',
    component: ComponentCreator('/', '2e1'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
