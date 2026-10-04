---
title: "Mechanistic Dissection of Cross-Attention Subspaces in T2I Diffusion Models"
date: 2026-01-20
draft: false
tags: ["mechanistic-interpretability", "diffusion-models", "cross-attention"]
summary: "AAAI 2026 — Jun-Hyun Bae, Wonyong Jo, Jaehyup Lee, Heechul Jung"
ShowToc: false
ShowReadingTime: false
ShowShareButtons: false
hideMeta: true
cover:
  image: "/images/aaai2026/fig3-spectral-isolation.webp"
  alt: "Spectral Isolation"
  hidden: true
---

<div style="text-align: center; margin-bottom: 1rem;">
<span class="venue-badge">AAAI 2026</span><br>
<span style="color: var(--secondary);"><strong>Jun-Hyun Bae</strong>, Wonyong Jo, Jaehyup Lee, Heechul Jung<br>
Kyungpook National University</span>
</div>

<div style="text-align: center; margin-bottom: 2rem;">
<a href="https://ojs.aaai.org/index.php/AAAI/article/view/39046" style="display: inline-block; padding: 0.4rem 1rem; border: 1px solid var(--primary); border-radius: 4px; margin: 0.2rem; text-decoration: none;">📄 Paper</a>
<a href="https://github.com/JunhyunB/diffusion-ov-circuits" style="display: inline-block; padding: 0.4rem 1rem; border: 1px solid var(--primary); border-radius: 4px; margin: 0.2rem; text-decoration: none;">💻 Code</a>
<a href="https://underline.io/lecture/140292-mechanistic-dissection-of-cross-attention-subspaces-in-text-to-image-diffusion-models" style="display: inline-block; padding: 0.4rem 1rem; border: 1px solid var(--primary); border-radius: 4px; margin: 0.2rem; text-decoration: none;">🎬 Poster & Video</a>
</div>

## Presentation

<div style="position: relative; width: 100%; max-width: 720px; margin: 0 auto 2rem; aspect-ratio: 3/2; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
<iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" src="https://underline.io/embed/140292-mechanistic-dissection-of-cross-attention-subspaces-in-text-to-image-diffusion-models?t=0" title="Mechanistic Dissection of Cross-Attention Subspaces in Text-to-Image Diffusion Models" loading="lazy" allowfullscreen></iframe>
</div>

---

## Abstract

Text-to-image diffusion models utilize cross-attention to integrate textual information into the visual latent space, yet the transformation from text embeddings to latent features remains largely unexplored. We provide a mechanistic analysis of the output-value (OV) circuits within cross-attention layers through spectral analysis via singular value decomposition. Our analysis demonstrates that semantic concepts are encoded in low-dimensional subspaces spanned by singular vectors in OV circuits across cross-attention heads. To verify this, we intervene on concept-related components in the diffusion process, demonstrating that intervention on identified spectral components affects conceptual changes. We further validate these findings by examining visual outputs of isolated subspaces and their alignment with text embedding space. Through this mechanistic understanding, we demonstrate that simply nullifying these spectral components can achieve targeted concept removal with performance comparable to existing methods while providing interpretability. Our work reveals how cross-attention layers encode semantic concepts in spectral subspaces of OV circuits, providing mechanistic insights and enabling precise concept manipulation without retraining.

---

## Overview

We reveal how OV circuits in cross-attention transform text into visual features, and propose a retraining-free method for targeted concept removal.

1. **Spectral Decomposition** — Decompose $\mathbf{W}_{\text{OV}}$ via SVD to extract independent text-to-visual transformation pathways.
2. **Concept Localization** — Discover that semantic concepts such as "Van Gogh style" or "nudity" concentrate in a small subset of spectral components.
3. **Spectral Nullification** — Remove only these components to achieve targeted concept removal without retraining, with performance comparable to existing methods.

![Spectral Isolation](/images/aaai2026/fig3-spectral-isolation.webp)

<p class="caption">
Spectral isolation of semantic concepts. For each concept, the top row removes the concept-related components and the bottom row keeps only those components (top-k%). Style concepts (Van Gogh, Picasso) reduce to stylistic patterns, such as brushstrokes and cubist shapes, separated from scene content, whereas the content concept (nudity) reconstructs complete human forms. This suggests that the model employs qualitatively different encoding strategies depending on concept type.
</p>

---

## Method

The output that cross-attention adds to the residual stream factorizes into two circuits. The QK circuit computes attention weights that determine which text tokens each spatial position attends to, while the OV circuit $\mathbf{W}_{\text{OV}} = \mathbf{W}_{\text{V}}\mathbf{W}_{\text{O}}$ transforms the attended tokens' semantic content into visual features. Attention patterns change throughout denoising, but the OV transformation is a fixed linear map, which makes the text-to-visual translation particularly amenable to static analysis.

Text embeddings are known to organize semantic information along intrinsic axes, so we hypothesize that $\mathbf{W}_{\text{OV}}$, which linearly maps this space into visual features, learns subspaces aligned with these axes. We decompose each head's OV matrix via SVD:

$$\mathbf{W}_{\text{OV}}^{(h)} = \sum_{i=1}^{r} \sigma_i^{(h)} \mathbf{u}_i^{(h)} (\mathbf{v}_i^{(h)})^\top$$

Each rank-1 term (spectral component) is an independent text-to-visual pathway that maps a direction $\mathbf{u}_i$ in text embedding space to a direction $\mathbf{v}_i$ in the head's output space with strength $\sigma_i$. Semantic concepts like "Van Gogh style" or "nudity" **concentrate in a small subset of these components**.

### Measuring Concept Contribution

To locate where a concept is encoded, we compare prompt pairs that differ only in the concept (e.g., "a mountain" vs. "a mountain in Van Gogh style"). For each prompt, the mean-pooled token embedding $\bar{\mathbf{c}}$ expressed in head $h$'s singular basis, $\mathbf{s}^{(h)}(\bar{\mathbf{c}}) = \bar{\mathbf{c}}\,\mathbf{U}^{(h)}\mathbf{\Sigma}^{(h)}$, directly determines the head's output. The difference of this representation between the two prompts measures the concept's contribution:

$$\Delta\mathbf{s}^{(h)} = \mathbf{s}^{(h)}(\bar{\mathbf{c}}_{\text{concept}}) - \mathbf{s}^{(h)}(\bar{\mathbf{c}}_{\text{base}}), \qquad [\Delta\mathbf{s}^{(h)}]_i = \sigma_i^{(h)} \langle \bar{\mathbf{c}}_{\text{concept}} - \bar{\mathbf{c}}_{\text{base}},\, \mathbf{u}_i^{(h)} \rangle$$

The norm $\|\Delta\mathbf{s}^{(h)}\|_2$ is the head's concept contribution, and the magnitude of each element, $|[\Delta\mathbf{s}^{(h)}]_i|$, is the contribution of an individual spectral component.

At the head level, scaling only the outputs of the 20 heads with the highest concept contribution (about 10% of the 195 heads in SD v2.1) is enough to modulate the concept's intensity.

![Head Modulation](/images/aaai2026/fig1-vangogh-modulation.webp)

<p class="caption">
Scaling the outputs of the top-20 high-contribution heads for the "Van Gogh" concept (about 10% of all 195 heads) by a factor $\alpha$.
</p>

### From Heads to Subspaces

Head-level analysis shows which heads contribute to a concept, but not how the concept is organized within each head. Given polysemanticity, where a single component encodes multiple distinct features, the question is whether a concept uses an entire head or is localized to specific spectral components within it. To find out, we rank all components across all heads by their contribution $|[\Delta\mathbf{s}^{(h)}]_i|$, take the top $k$% as the concept's spectral signature $\mathcal{S}_c$, and scale only these components:

$$\widetilde{\mathbf{W}}_{\text{OV}}^{(h)} = \mathbf{W}_{\text{OV}}^{(h)} + (\alpha - 1) \sum_{i:\,(h,i) \in \mathcal{S}_c} \sigma_i^{(h)} \mathbf{u}_i^{(h)} (\mathbf{v}_i^{(h)})^\top$$

$\alpha = 0$ removes the concept components (Spectral Nullification), $\alpha = 1$ keeps the original model, and $\alpha > 1$ amplifies the concept. In SD v2.1, removing the top 15–20% of concept-related components is enough to eliminate the concept from generated images, while removing more than 30% can degrade overall generation quality.

The figure below shows that manipulating the same 10% gives different results depending on whether entire heads or only spectral components are scaled. Concepts are localized to specific spectral subspaces rather than whole heads, which enables precise identification and manipulation of concept components through spectral analysis.

![Spectral vs Head](/images/aaai2026/fig2-spectral-vs-head.webp)

<p class="caption">
Spectral modulation (top; 10% of the components in $\mathcal{S}_c$) vs head-level modulation (bottom; the top 10% of high-contribution heads) with varying $\alpha$.
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

SN ties with RECE for 2nd place on I2P (4.24%), ranks 2nd on MMA, P4D, and UnLearnDiffAtk, and, without any additional training, achieves lower ASR than every training-based method (ESD, CA, MACE, SDID) on all benchmarks. On Ring-A-Bell, however, its ASR (30.53–41.05%) is higher than that of the closed-form methods (UCE, RECE) and SLD-Strong. The spread from 4.24% on I2P to 41.05% on Ring-A-Bell K16 reflects differences in adversarial prompt design and attack sophistication across benchmarks. SLD-Strong, the best on most benchmarks, is an inference-time guidance method that intervenes throughout the generation process, while SN **removes only the spectral components of the weight matrix, with no additional training** — a fundamentally different approach. Generation quality is measured by CLIP score on 1,000 COCO captions; as the figure below shows, SN occupies a competitive position on the quality–removal trade-off.

![Quality Tradeoff](/images/aaai2026/fig7-quality-tradeoff.webp)

<p class="caption">
Concept removal performance (P4D ASR) vs generation quality (CLIP score). SN achieves a competitive trade-off without retraining. SLD-Strong achieves the lowest ASR but at the cost of reduced generation quality.
</p>

### Verifying the Semantics of Spectral Subspaces

We verify that the identified spectral subspaces genuinely capture the semantics of their target concepts through two approaches.

**Text space alignment**: We reconstruct the text-embedding difference between concept and base prompts using only the concept-specific spectral components, and compute its cosine similarity with all 49,408 CLIP vocabulary tokens. For nudity, tokens such as "nude", "naked", "topless", "erotica", and "nsfw" appear among the top 16 in both of the top-2 heads, showing that the subspace carries the concept's semantics. Tokens unrelated to nudity are mixed in as well, indicating that the subspace captures a semantic neighborhood (polysemanticity) rather than a perfectly isolated concept.

![Token Alignment](/images/aaai2026/fig6-token-alignment.webp)

<p class="caption">
The 16 tokens with the highest cosine similarity to vectors reconstructed from nudity-related spectral components, for each of the top-2 heads. Highlighted tokens are explicitly nudity-related.
</p>

**Causal verification (t-SNE) and inter-concept structure (Jaccard)**: Removing concept-related spectral components causes the base/concept prompt clusters to merge in the t-SNE of head outputs. This provides causal evidence that these components are indeed responsible for encoding the concept. Jaccard similarity analysis reveals that semantically similar concepts (Van Gogh↔Monet) share more spectral components, while each concept retains a unique spectral signature.

![t-SNE Jaccard](/images/aaai2026/fig4-tsne-jaccard.webp)

<p class="caption">
(a) t-SNE of head outputs before and after removing the top 10% of concept-related spectral components. Clusters merge after removal. (b) Jaccard similarity between concepts. Similar concepts overlap but each maintains a unique signature.
</p>

### Qualitative

A comparison on adversarial prompts from the I2P benchmark shows that SN removes inappropriate content while preserving the scene composition.

![I2P Comparison](/images/aaai2026/fig8-i2p-comparison.webp)

<p class="caption">
Generated images for I2P adversarial prompts. From left: SD v1.4 (original), CA, RECE, SLD-Medium, SLD-Strong, SAFREE, and SN (ours).
</p>

---
