---
title: "Mechanistic Dissection of Cross-Attention Subspaces in Text-to-Image Diffusion Models"
date: 2026-01-20
draft: false
tags: ["mechanistic-interpretability", "diffusion-models", "cross-attention"]
summary: "AAAI 2026 — Jun-Hyun Bae, Wonyong Jo, Jaehyup Lee, Heechul Jung"
ShowToc: false
ShowReadingTime: false
ShowShareButtons: false
hideMeta: true
cover:
  image: "/videos/aaai2026-ov-circuits.jpg"
  alt: "Spectral Modulation of Cross-Attention OV Circuits"
  hidden: true
---

{{< paper-header
  venue="AAAI 2026"
  authors="<strong>Jun-Hyun Bae</strong>, Wonyong Jo, Jaehyup Lee, Heechul Jung"
  affil="Kyungpook National University"
  paper="https://ojs.aaai.org/index.php/AAAI/article/view/39046"
  code="https://github.com/JunhyunB/diffusion-ov-circuits"
  video="https://underline.io/lecture/140292-mechanistic-dissection-of-cross-attention-subspaces-in-text-to-image-diffusion-models"
  videoLabel="Poster & Video"
>}}

{{< video src="/videos/aaai2026-ov-circuits.mp4" poster="/videos/aaai2026-ov-circuits.jpg" caption="SVD subspace geometry of cross-attention OV circuits and zero-retraining concept control (Eq. 9)" >}}

## Abstract

Text-to-image diffusion models utilize cross-attention to integrate textual information into the visual latent space, yet the transformation from text embeddings to latent features remains largely unexplored. We provide a mechanistic analysis of the output-value (OV) circuits within cross-attention layers through spectral analysis via singular value decomposition. Our analysis demonstrates that semantic concepts are encoded in low-dimensional subspaces spanned by singular vectors in OV circuits across cross-attention heads. To verify this, we intervene on concept-related components in the diffusion process, demonstrating that intervention on identified spectral components affects conceptual changes. We further validate these findings by examining visual outputs of isolated subspaces and their alignment with text embedding space. Through this mechanistic understanding, we demonstrate that simply nullifying these spectral components can achieve targeted concept removal with performance comparable to existing methods while providing interpretability. Our work reveals how cross-attention layers encode semantic concepts in spectral subspaces of OV circuits, providing mechanistic insights and enabling precise concept manipulation without retraining.

---

## Overview

In Stable Diffusion, Van Gogh, Monet, and Picasso share cross-attention heads but have high contributions along different singular vectors within them. We decompose the OV transformations inside each head to analyze these differences.

We apply SVD to the OV matrices and compare prompt pairs such as “a mountain” and “a mountain in Van Gogh style”. Scaling components whose responses differ strongly between the prompts changes the style of generated images. When only style-related OV components are retained, characteristic brushstrokes and forms remain even as scene details disappear. The same analysis is also applied to removing nudity-related components.

![Spectral Isolation](/images/aaai2026/fig3-spectral-isolation.webp)

<p class="caption">
Spectral isolation of semantic concepts. For each concept, the top row removes the concept-related components and the bottom row keeps only those components (top-k%). Style concepts (Van Gogh, Picasso) reduce to stylistic patterns, such as brushstrokes and cubist shapes, separated from scene content, whereas the content concept (nudity) reconstructs complete human forms. This suggests that the model employs qualitatively different encoding strategies depending on concept type.
</p>

---

## Method

The output that cross-attention adds to the residual stream factorizes into two circuits. The QK circuit computes attention weights that determine which text tokens each spatial position attends to, while the OV circuit $\mathbf{W}_{\text{OV}} = \mathbf{W}_{\text{V}}\mathbf{W}_{\text{O}}$ transforms the attended tokens' semantic content into visual features. Attention patterns change throughout denoising, but the OV transformation is a fixed linear map, which makes the text-to-visual translation particularly amenable to static analysis.

Text embeddings are known to organize semantic information along intrinsic axes, so we hypothesize that $\mathbf{W}_{\text{OV}}$, which linearly maps this space into visual features, learns subspaces aligned with these axes. We decompose each head's OV matrix via SVD:

$$\mathbf{W}_{\text{OV}}^{(h)} = \sum_{i=1}^{r} \textcolor{#A86A14}{\sigma_i^{(h)}} \, \textcolor{#1E4E79}{\mathbf{u}_i^{(h)}} \, (\textcolor{#2A6F4E}{\mathbf{v}_i^{(h)}})^\top$$

Each rank-1 term (spectral component) is an independent text-to-visual pathway that maps a direction $\mathbf{u}_i$ in text embedding space to a direction $\mathbf{v}_i$ in the head's output space with strength $\sigma_i$. Semantic concepts like "Van Gogh style" or "nudity" concentrate in a small subset of these components.

### Measuring Concept Contribution

To locate a concept, we compare prompt pairs that differ only in that concept (e.g., “a mountain” and “a mountain in Van Gogh style”). We project each prompt's mean-pooled token embedding $\bar{\mathbf{c}}$ onto head $h$'s singular vectors and weight it by the singular values: $\mathbf{s}^{(h)}(\bar{\mathbf{c}}) = \bar{\mathbf{c}}\,\mathbf{U}^{(h)}\mathbf{\Sigma}^{(h)}$. Components with a large difference between prompts are candidates for carrying the concept.

$$\textcolor{#B84327}{\Delta\mathbf{s}^{(h)}} = \mathbf{s}^{(h)}(\textcolor{#1E4E79}{\bar{\mathbf{c}}_{\text{concept}}}) - \mathbf{s}^{(h)}(\textcolor{#1E4E79}{\bar{\mathbf{c}}_{\text{base}}}), \qquad [\textcolor{#B84327}{\Delta\mathbf{s}^{(h)}}]_i = \textcolor{#A86A14}{\sigma_i^{(h)}} \langle \textcolor{#B84327}{\bar{\mathbf{c}}_{\text{concept}} - \bar{\mathbf{c}}_{\text{base}}},\, \textcolor{#1E4E79}{\mathbf{u}_i^{(h)}} \rangle$$

The norm $\|\Delta\mathbf{s}^{(h)}\|_2$ is the head's concept contribution, and the magnitude of each element, $|[\Delta\mathbf{s}^{(h)}]_i|$, is the contribution of an individual spectral component.

At the head level, scaling only the outputs of the 20 heads with the highest concept contribution (about 10% of the 195 heads in SD v2.1) is enough to modulate the concept's intensity.

![Head Modulation](/images/aaai2026/fig1-vangogh-modulation.webp)

<p class="caption">
Scaling the outputs of the top-20 high-contribution heads for the "Van Gogh" concept (about 10% of all 195 heads) by a factor $\alpha$.
</p>

### From Heads to Subspaces

Head-level analysis shows which heads contribute to a concept, but not how the concept is organized within each head. Given polysemanticity, where a single component encodes multiple distinct features, the question is whether a concept uses an entire head or is localized to specific spectral components within it. To find out, we rank all components across all heads by their contribution $|[\Delta\mathbf{s}^{(h)}]_i|$, take the top $k$% as the concept's spectral signature $\mathcal{S}_c$, and scale only these components:

$$\widetilde{\mathbf{W}}_{\text{OV}}^{(h)} = \mathbf{W}_{\text{OV}}^{(h)} + (\textcolor{#B84327}{\alpha} - 1) \sum_{i:\,(h,i) \in \textcolor{#B84327}{\mathcal{S}_c}} \textcolor{#A86A14}{\sigma_i^{(h)}} \, \textcolor{#1E4E79}{\mathbf{u}_i^{(h)}} \, (\textcolor{#2A6F4E}{\mathbf{v}_i^{(h)}})^\top$$

{{< ov-svd-widget >}}

$\alpha = 0$ removes the selected components (Spectral Nullification), $\alpha = 1$ keeps the original model, and $\alpha > 1$ increases their contribution. In qualitative experiments on SD v2.1, removing the top 15–20% by concept contribution suppressed the target concept in the illustrated examples. Removing more than 30% could also degrade overall generation quality.

The figure below compares scaling high-contribution heads (top 10%) with scaling selected components within heads (top 10%), showing how finer-grained interventions change the way a concept can be controlled.

![Spectral vs Head](/images/aaai2026/fig2-spectral-vs-head.webp)

<p class="caption">
Spectral modulation (top; the top 10% of all components by concept contribution) and head-level modulation (bottom; the top 10% of heads by contribution), with varying $\alpha$.
</p>

The figure below takes the heads that score high for all three artistic styles (Van Gogh, Monet, and Picasso) and shows the contribution of each singular vector within them. Even within the same head, the three concepts activate different singular vectors, and the high-contribution singular vectors do not necessarily correspond to the largest singular values (lowest indices). The concepts thus share heads yet exhibit their own activation patterns, partially overlapping but distinguishable.

![Head Distribution](/images/aaai2026/fig5-head-distribution.webp)

<p class="caption">
Contribution of each singular vector within heads that score high for all three artistic styles. Different concepts activate different singular vectors within the same head.
</p>

---

## Results

### Concept Removal Benchmark

We evaluate Spectral Nullification (SN) for nudity removal on SD v1.4 across five adversarial prompt benchmarks — Ring-A-Bell (K16, K38, K77), I2P, MMA, P4D, and UnLearnDiffAtk. Following the observation above, SN nullifies the top 20% of concept-related spectral components, and the metric is the Attack Success Rate measured with NudeNet (ASR; lower is better).

<p class="caption">Attack Success Rate (%, ↓) on nudity-related content across adversarial benchmarks. Best per column in <strong>bold</strong>, second-best <u>underlined</u>. Method types are color-coded — gray: training-based, blue: closed-form, green: inference-time, deep blue: spectral.</p>

<div style="overflow-x: auto;">
<table>
<thead>
<tr>
<th rowspan="2">Method</th>
<th colspan="3" style="text-align:center;">Ring-A-Bell</th>
<th rowspan="2">I2P</th>
<th rowspan="2">MMA</th>
<th rowspan="2">P4D</th>
<th rowspan="2">UnLearn</th>
</tr>
<tr>
<th style="text-align:center;">K16</th>
<th style="text-align:center;">K38</th>
<th style="text-align:center;">K77</th>
</tr>
</thead>
<tbody>
<tr class="method-base"><td>SD v1.4</td><td>97.89</td><td>94.74</td><td>87.37</td><td>25.03</td><td>68.10</td><td>69.76</td><td>50.70</td></tr>
<tr class="method-training group-start"><td>ESD</td><td>76.84</td><td>78.95</td><td>74.74</td><td>13.04</td><td>24.80</td><td>50.24</td><td>26.06</td></tr>
<tr class="method-training"><td>CA</td><td>88.42</td><td>88.42</td><td>84.21</td><td>19.30</td><td>58.50</td><td>63.41</td><td>44.37</td></tr>
<tr class="method-training"><td>MACE</td><td>89.47</td><td>95.79</td><td>93.68</td><td>25.56</td><td>66.00</td><td>68.29</td><td>50.70</td></tr>
<tr class="method-training"><td>SDID</td><td>95.79</td><td>91.58</td><td>84.21</td><td>23.12</td><td>62.00</td><td>66.83</td><td>48.59</td></tr>
<tr class="method-closed group-start"><td>UCE</td><td>22.11</td><td>18.95</td><td>21.05</td><td>8.06</td><td>41.00</td><td>38.05</td><td>21.13</td></tr>
<tr class="method-closed"><td>RECE</td><td><strong>10.53</strong></td><td><strong>9.47</strong></td><td><u>7.37</u></td><td><u>4.24</u></td><td>25.00</td><td>21.46</td><td>9.15</td></tr>
<tr class="method-inference group-start"><td>SLD-Medium</td><td>68.42</td><td>60.00</td><td>50.53</td><td>8.38</td><td>48.70</td><td>43.90</td><td>23.94</td></tr>
<tr class="method-inference"><td>SLD-Strong</td><td><u>18.95</u></td><td><u>10.53</u></td><td><strong>6.32</strong></td><td><strong>2.33</strong></td><td><strong>7.70</strong></td><td><strong>11.71</strong></td><td><strong>7.04</strong></td></tr>
<tr class="method-inference"><td>SAFREE</td><td>65.26</td><td>55.79</td><td>45.26</td><td>6.26</td><td>29.90</td><td>38.54</td><td>14.79</td></tr>
<tr class="method-spectral group-start"><td><strong>SN (Ours)</strong></td><td>41.05</td><td>35.79</td><td>30.53</td><td><u>4.24</u></td><td><u>17.60</u></td><td><u>18.54</u></td><td><u>8.45</u></td></tr>
</tbody>
</table>
</div>

SN ties with RECE for second on I2P (4.24%) and ranks second on MMA, P4D, and UnLearnDiffAtk. It has lower ASR than the training-based methods in this table (ESD, CA, MACE, SDID) on every benchmark, but higher ASR than UCE, RECE, and SLD-Strong on Ring-A-Bell. Performance therefore varies with the attack prompts.

SN removes the identified concept-related components from the OV matrices without additional training. The trade-off between removal and text–image alignment is evaluated with CLIP score on 1,000 COCO captions.

![Quality Tradeoff](/images/aaai2026/fig7-quality-tradeoff.webp)

<p class="caption">
Concept removal performance (P4D ASR) versus text–image alignment (CLIP score). SN achieves a competitive balance without retraining. SLD-Strong has the lowest ASR but also a lower CLIP score.
</p>

### Verifying the Semantics of Spectral Subspaces

We verify that the identified spectral subspaces genuinely capture the semantics of their target concepts through two approaches.

**Text space alignment**: We reconstruct the text-embedding difference between concept and base prompts using the input directions of concept-specific components, then compute cosine similarity with all 49,408 CLIP vocabulary tokens. For the top two heads contributing to nudity, one head's top 16 tokens include “nudes”, “nsfw”, and “naked”; the other includes “topless”, “lingerie”, “erotica”, and “nude”. The lists differ, but both contain concept-related tokens alongside some unrelated ones.

![Token Alignment](/images/aaai2026/fig6-token-alignment.webp)

<p class="caption">
The 16 tokens with the highest cosine similarity to vectors reconstructed from nudity-related spectral components, for each of the top-2 heads. Highlighted tokens are explicitly nudity-related.
</p>

**Representations before and after intervention (t-SNE), and overlap between concepts (Jaccard)**: Removing concept-related components increases overlap between the base/concept prompt clusters in a t-SNE of head outputs. Jaccard similarity shows that related concepts such as Van Gogh and Monet share more components while retaining distinguishable spectral signatures.

![t-SNE Jaccard](/images/aaai2026/fig4-tsne-jaccard.webp)

<p class="caption">
(a) t-SNE of head outputs before and after removing the top 10% of components by concept contribution. Base/concept clusters overlap more after removal. (b) Jaccard similarity between concepts. Related concepts overlap while retaining distinguishable signatures.
</p>

### Qualitative

In the I2P adversarial examples below, SN suppresses the target content while preserving scene composition.

![I2P Comparison](/images/aaai2026/fig8-i2p-comparison.webp)

<p class="caption">
Generated images for I2P adversarial prompts. From left: SD v1.4 (original), CA, RECE, SLD-Medium, SLD-Strong, SAFREE, and SN (ours).
</p>

---

## Presentation

<div class="paper-video-stage" style="max-width: 720px; margin: 0 auto 2rem; aspect-ratio: 3/2;">
<iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" src="https://underline.io/embed/140292-mechanistic-dissection-of-cross-attention-subspaces-in-text-to-image-diffusion-models?t=0" title="Mechanistic Dissection of Cross-Attention Subspaces in Text-to-Image Diffusion Models" loading="lazy" allowfullscreen></iframe>
</div>

---
