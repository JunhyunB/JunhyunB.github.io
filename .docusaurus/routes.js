import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
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
    component: ComponentCreator('/docs', 'd89'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', 'd69'),
        routes: [
          {
            path: '/docs/tags',
            component: ComponentCreator('/docs/tags', 'fce'),
            exact: true
          },
          {
            path: '/docs/tags/attention-mechanisms',
            component: ComponentCreator('/docs/tags/attention-mechanisms', '475'),
            exact: true
          },
          {
            path: '/docs/tags/diffusion-models',
            component: ComponentCreator('/docs/tags/diffusion-models', 'ac4'),
            exact: true
          },
          {
            path: '/docs/tags/image-editing',
            component: ComponentCreator('/docs/tags/image-editing', '427'),
            exact: true
          },
          {
            path: '/docs/tags/stable-diffusion',
            component: ComponentCreator('/docs/tags/stable-diffusion', '33a'),
            exact: true
          },
          {
            path: '/docs/tags/template',
            component: ComponentCreator('/docs/tags/template', '1dd'),
            exact: true
          },
          {
            path: '/docs',
            component: ComponentCreator('/docs', 'ba5'),
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
                path: '/docs/trustworthy-ai/diffusion-based/towards-undersating-cross-and-self-attention',
                component: ComponentCreator('/docs/trustworthy-ai/diffusion-based/towards-undersating-cross-and-self-attention', '32c'),
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
