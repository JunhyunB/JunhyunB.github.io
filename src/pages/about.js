import React from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function About() {
  const {siteConfig} = useDocusaurusContext();
  
  return (
    <Layout
      title="About Me"
      description="About Jun-Hyun Bae">
      <main className="container margin-vert--lg">
        <div className="row">
          <div className="col col--8 col--offset-2">
            <Heading as="h1" className="text--center margin-bottom--xl">
              About Me
            </Heading>
            
            <div className="margin-bottom--xl">
              <Heading as="h2">Introduction</Heading>
              <p>
                I'm Jun-Hyun Bae, an AI researcher focusing on Generalization in Machine Learning.
                I am passionate about understanding the inner workings of machine learning models.
              </p>
              <p>
                This website serves as a platform for me to share my research notes, 
                paper summaries, and insights on topics I find interesting.
              </p>
            </div>
            
            <div className="margin-bottom--xl">
              <Heading as="h2">Research Interests</Heading>
              <ul>
                <li><strong>Generalization in Machine Learning:</strong> Understanding why models generalize well</li>
                <li><strong>Mechanistic Interpretability:</strong> Understanding the inner workings of machine learning models</li>
                <li><strong>Causality:</strong> Understanding the causal relationships between variables</li>
              </ul>
            </div>
            
            <div className="margin-bottom--xl">
              <Heading as="h2">Education</Heading>
              <ul>
                <li><strong>Degree</strong> - Institution, Year</li>
                <li><strong>Degree</strong> - Institution, Year</li>
              </ul>
            </div>
            
            <div className="margin-bottom--xl">
              <Heading as="h2">Publications</Heading>
              <ul>
                <li>
                  <p><strong>Title of Publication</strong></p>
                  <p>Authors, Conference/Journal, Year</p>
                  <p><a href="#">Link to paper</a></p>
                </li>
                <li>
                  <p><strong>Title of Publication</strong></p>
                  <p>Authors, Conference/Journal, Year</p>
                  <p><a href="#">Link to paper</a></p>
                </li>
              </ul>
            </div>
            
            <div className="margin-bottom--xl">
              <Heading as="h2">Contact</Heading>
              <p>
                You can reach me at:
              </p>
              <ul>
                <li><strong>Email:</strong> junhyun.bae.kr@gmail.com</li>
                <li><strong>GitHub:</strong> <a href="https://github.com/JunhyunB">JunhyunB</a></li>
                {/* Add more contact methods as needed */}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
} 