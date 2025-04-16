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
    path: '/blog',
    component: ComponentCreator('/blog', 'b2f'),
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
    path: '/blog/authors/all-sebastien-lorber-articles',
    component: ComponentCreator('/blog/authors/all-sebastien-lorber-articles', '4a1'),
    exact: true
  },
  {
    path: '/blog/authors/yangshun',
    component: ComponentCreator('/blog/authors/yangshun', 'a68'),
    exact: true
  },
  {
    path: '/blog/first-blog-post',
    component: ComponentCreator('/blog/first-blog-post', '89a'),
    exact: true
  },
  {
    path: '/blog/long-blog-post',
    component: ComponentCreator('/blog/long-blog-post', '9ad'),
    exact: true
  },
  {
    path: '/blog/mdx-blog-post',
    component: ComponentCreator('/blog/mdx-blog-post', 'e9f'),
    exact: true
  },
  {
    path: '/blog/tags',
    component: ComponentCreator('/blog/tags', '287'),
    exact: true
  },
  {
    path: '/blog/tags/docusaurus',
    component: ComponentCreator('/blog/tags/docusaurus', '704'),
    exact: true
  },
  {
    path: '/blog/tags/facebook',
    component: ComponentCreator('/blog/tags/facebook', '858'),
    exact: true
  },
  {
    path: '/blog/tags/hello',
    component: ComponentCreator('/blog/tags/hello', '299'),
    exact: true
  },
  {
    path: '/blog/tags/hola',
    component: ComponentCreator('/blog/tags/hola', '00d'),
    exact: true
  },
  {
    path: '/blog/welcome',
    component: ComponentCreator('/blog/welcome', 'd2b'),
    exact: true
  },
  {
    path: '/graph',
    component: ComponentCreator('/graph', '766'),
    exact: true
  },
  {
    path: '/markdown-page',
    component: ComponentCreator('/markdown-page', '3d7'),
    exact: true
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', '499'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', 'c11'),
        routes: [
          {
            path: '/docs/tags',
            component: ComponentCreator('/docs/tags', 'fce'),
            exact: true
          },
          {
            path: '/docs/tags/ai',
            component: ComponentCreator('/docs/tags/ai', 'bd3'),
            exact: true
          },
          {
            path: '/docs/tags/computer-vision',
            component: ComponentCreator('/docs/tags/computer-vision', 'cd0'),
            exact: true
          },
          {
            path: '/docs/tags/deep-learning',
            component: ComponentCreator('/docs/tags/deep-learning', '004'),
            exact: true
          },
          {
            path: '/docs/tags/image-recognition',
            component: ComponentCreator('/docs/tags/image-recognition', '4a1'),
            exact: true
          },
          {
            path: '/docs/tags/machine-learning',
            component: ComponentCreator('/docs/tags/machine-learning', '4c7'),
            exact: true
          },
          {
            path: '/docs/tags/neural-networks',
            component: ComponentCreator('/docs/tags/neural-networks', '581'),
            exact: true
          },
          {
            path: '/docs',
            component: ComponentCreator('/docs', '7ca'),
            routes: [
              {
                path: '/docs/computer-vision/',
                component: ComponentCreator('/docs/computer-vision/', '5e1'),
                exact: true,
                sidebar: "papersSidebar"
              },
              {
                path: '/docs/computer-vision/example-paper',
                component: ComponentCreator('/docs/computer-vision/example-paper', '600'),
                exact: true,
                sidebar: "papersSidebar"
              },
              {
                path: '/docs/computer-vision/skip-connections',
                component: ComponentCreator('/docs/computer-vision/skip-connections', '596'),
                exact: true,
                sidebar: "papersSidebar"
              },
              {
                path: '/docs/intro',
                component: ComponentCreator('/docs/intro', '3af'),
                exact: true,
                sidebar: "papersSidebar"
              },
              {
                path: '/docs/machine-learning/',
                component: ComponentCreator('/docs/machine-learning/', '187'),
                exact: true,
                sidebar: "papersSidebar"
              },
              {
                path: '/docs/machine-learning/deep-learning',
                component: ComponentCreator('/docs/machine-learning/deep-learning', 'd16'),
                exact: true,
                sidebar: "papersSidebar"
              },
              {
                path: '/docs/machine-learning/neural-networks',
                component: ComponentCreator('/docs/machine-learning/neural-networks', 'cbe'),
                exact: true,
                sidebar: "papersSidebar"
              },
              {
                path: '/docs/nlp/',
                component: ComponentCreator('/docs/nlp/', '92c'),
                exact: true,
                sidebar: "papersSidebar"
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
