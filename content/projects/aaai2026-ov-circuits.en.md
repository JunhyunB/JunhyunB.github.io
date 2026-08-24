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

Text-to-image diffusion models utilize cross-attention to integrate textual information into the visual latent space, yet the transformation from text embeddings to latent features remains largely unexplored. We provide a mechanistic analysis of the output-value (OV) circuits within cross-attention layers through spectral analysis via singular value decomposition. Our analysis reveals that semantic concepts are encoded in low-dimensional subspaces spanned by singular vectors in OV circuits across cross-attention heads. To verify this, we intervene on concept-related components in the diffusion process, demonstrating that intervention on identified spectral components affects conceptual changes. We further validate these findings by examining visual outputs of isolated subspaces and their alignment with text embedding space. Through this mechanistic understanding, we demonstrate that only nullifying these spectral components can achieve targeted concept removal with performance comparable to existing methods while providing interpretability. Our work reveals how cross-attention layers encode semantic concepts in spectral subspaces of OV circuits, providing mechanistic insights and enabling precise concept manipulation without retraining.

---

## Overview

We reveal how OV circuits in cross-attention transform text into visual features, and propose a retraining-free method for targeted concept removal.

1. **Spectral Decomposition** — Decompose $\mathbf{W}_{\text{OV}}$ via SVD to extract independent text-to-visual transformation pathways.
2. **Concept Localization** — Discover that semantic concepts such as "Van Gogh style" or "nudity" concentrate in a small subset of spectral components.
3. **Spectral Nullification** — Remove only these components to achieve targeted concept removal without retraining, matching existing methods.

![Spectral Isolation](/images/aaai2026/fig3-spectral-isolation.webp)

<p class="caption">
Spectral isolation of each concept. Style concepts (Van Gogh, Picasso) decompose into visual patterns such as texture and color, while content concepts (Nudity) retain holistic human forms. This suggests that the model employs qualitatively different encoding strategies depending on concept type.
</p>

---

## Method

The key mechanism that transforms text into visual features in cross-attention is the $\mathbf{W}_{\text{OV}}$ matrix. Text embeddings organize semantic information along intrinsic axes, and $\mathbf{W}_{\text{OV}}$ learns low-dimensional subspaces aligned with these axes to perform concept-specific transformations. Decomposing this matrix via SVD yields spectral components that each serve as independent text-to-visual pathways, and semantic concepts like "Van Gogh style" or "nudity" **concentrate in a small subset of these components**.

Only about 10% of all heads contribute strongly to any given concept, and scaling their outputs modulates the concept's intensity.

![Head Modulation](/images/aaai2026/fig1-vangogh-modulation.webp)

<p class="caption">
Scaling the output of high-contribution heads (~10% of all heads) for the "Van Gogh" concept with factor $\alpha$.
</p>

However, head-level manipulation has **limited precision**. Since individual attention heads encode multiple concepts simultaneously (polysemanticity), scaling an entire head alters unintended concepts as well. Operating at the spectral component level resolves this issue, enabling disentangled control over distinct concept dimensions such as style and content.

![Spectral vs Head](/images/aaai2026/fig2-spectral-vs-head.webp)

<p class="caption">
Spectral modulation (top) vs head-level modulation (bottom). Head-level manipulation changes attributes beyond the target concept, while spectral-level manipulation provides precise control over only the intended concept.
</p>

The figure below shows the distribution of concept contributions across all heads. Most heads contribute minimally to any given concept, while a small number of heads carry the majority of the signal. Furthermore, within the same head, Van Gogh, Monet, and Picasso activate different singular vectors, and the high-contribution singular vectors do not necessarily correspond to the largest singular values (lowest indices). Each concept exhibits a unique activation pattern.

![Head Distribution](/images/aaai2026/fig5-head-distribution.webp)

<p class="caption">
Distribution of concept contributions across heads. Concept information is concentrated in a small number of high-contribution heads.
</p>

---

## Results

### Concept Removal Benchmark

We evaluate Spectral Nullification (SN) for NSFW concept removal across five adversarial prompt benchmarks — Ring-A-Bell (K16, K38, K77), I2P, MMA, P4D, and UnLearnDiffAtk. The metric is Attack Success Rate (ASR; lower is better).

<p class="caption">Attack Success Rate (%, ↓) across adversarial benchmarks and generation quality (FID↓) on 1,000 COCO captions. Best ASR per column in <strong>bold</strong>, second-best <u>underlined</u>. Method types are color-coded — gray: training-based, blue: closed-form, green: inference-time, deep blue: spectral.</p>

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
<th rowspan="2">FID ↓</th>
</tr>
<tr>
<th style="text-align:center;">K16</th>
<th style="text-align:center;">K38</th>
<th style="text-align:center;">K77</th>
</tr>
</thead>
<tbody>
<tr class="method-base"><td>SD v1.4</td><td>97.89</td><td>94.74</td><td>87.37</td><td>25.03</td><td>68.10</td><td>69.76</td><td>50.70</td><td>—</td></tr>
<tr class="method-training group-start"><td>ESD</td><td>76.84</td><td>78.95</td><td>74.74</td><td>13.04</td><td>24.80</td><td>50.24</td><td>26.06</td><td>38.95</td></tr>
<tr class="method-training"><td>CA</td><td>88.42</td><td>88.42</td><td>84.21</td><td>19.30</td><td>58.50</td><td>63.41</td><td>44.37</td><td>26.02</td></tr>
<tr class="method-training"><td>MACE</td><td>89.47</td><td>95.79</td><td>93.68</td><td>25.56</td><td>66.00</td><td>68.29</td><td>50.70</td><td>33.38</td></tr>
<tr class="method-training"><td>SDID</td><td>95.79</td><td>91.58</td><td>84.21</td><td>23.12</td><td>62.00</td><td>66.83</td><td>48.59</td><td>39.74</td></tr>
<tr class="method-closed group-start"><td>UCE</td><td>22.11</td><td>18.95</td><td>21.05</td><td>8.06</td><td>41.00</td><td>38.05</td><td>21.13</td><td>34.43</td></tr>
<tr class="method-closed"><td>RECE</td><td><strong>10.53</strong></td><td><strong>9.47</strong></td><td><u>7.37</u></td><td><u>4.24</u></td><td>25.00</td><td>21.46</td><td>9.15</td><td>40.00</td></tr>
<tr class="method-inference group-start"><td>SLD-Medium</td><td>68.42</td><td>60.00</td><td>50.53</td><td>8.38</td><td>48.70</td><td>43.90</td><td>23.94</td><td>32.09</td></tr>
<tr class="method-inference"><td>SLD-Strong</td><td><u>18.95</u></td><td><u>10.53</u></td><td><strong>6.32</strong></td><td><strong>2.33</strong></td><td><strong>7.70</strong></td><td><strong>11.71</strong></td><td><strong>7.04</strong></td><td>41.34</td></tr>
<tr class="method-inference"><td>SAFREE</td><td>65.26</td><td>55.79</td><td>45.26</td><td>6.26</td><td>29.90</td><td>38.54</td><td>14.79</td><td>40.71</td></tr>
<tr class="method-spectral group-start"><td><strong>SN (Ours)</strong></td><td>41.05</td><td>35.79</td><td>30.53</td><td><u>4.24</u></td><td><u>17.60</u></td><td><u>18.54</u></td><td><u>8.45</u></td><td>40.67</td></tr>
</tbody>
</table>
</div>

SN ties with RECE for 2nd place on I2P (4.2%) and ranks 2nd on MMA, P4D, and UnLearnDiffAtk. The overall best, SLD-Strong, is an inference-time guidance method that intervenes throughout the generation process, while SN **removes only the spectral components of the weight matrix, with no additional training** — a fundamentally different approach. Notably, without any additional training, SN surpasses all training-based methods in the table (ESD, CA, MACE, SDID). On generation quality, SN also maintains FID 40.67, matching existing methods and remaining competitive on the quality–removal trade-off.

![Quality Tradeoff](/images/aaai2026/fig7-quality-tradeoff.webp)

<p class="caption">
Concept removal performance (P4D ASR) vs generation quality (CLIP score). SN achieves a competitive trade-off without retraining. SLD-Strong achieves the lowest ASR but at the cost of reduced generation quality.
</p>

### Verifying the Semantics of Spectral Subspaces

We verify that the identified spectral subspaces genuinely capture the semantics of their target concepts through two approaches.

**Text space alignment**: We reconstruct text difference vectors using concept-specific spectral components and compute cosine similarity against all 49,408 CLIP vocabulary tokens. For the nudity concept, tokens such as "nude", "naked", "topless", "erotica", and "nsfw" rank at the top, confirming that the spectral subspace accurately captures the intended semantics.

![Token Alignment](/images/aaai2026/fig6-token-alignment.webp)

<p class="caption">
Cosine similarity between reconstructed vectors from concept spectral components and the CLIP vocabulary. Concept-related tokens rank at the top.
</p>

**Causal verification (t-SNE) and inter-concept structure (Jaccard)**: Removing concept-related spectral components causes the base/concept prompt clusters to merge in the t-SNE of head outputs. This provides causal evidence that these components are indeed responsible for encoding the concept. Jaccard similarity analysis reveals that semantically similar concepts (Van Gogh↔Monet) share more spectral components, while each concept retains a unique spectral signature.

![t-SNE Jaccard](/images/aaai2026/fig4-tsne-jaccard.webp)

<p class="caption">
(a) t-SNE before and after spectral component removal. Clusters merge after removal. (b) Jaccard similarity between concepts. Similar concepts overlap but each maintains a unique signature.
</p>

### Qualitative

Applying SN to adversarial prompts from the I2P benchmark effectively removes inappropriate content.

![I2P Comparison](/images/aaai2026/fig8-i2p-comparison.webp)

<p class="caption">
I2P benchmark with adversarial prompts. Left: SD v1.4 (before SN). Right: after SN.
</p>

### Scalability & Practical Notes

- **SD v2.1**: 195 cross-attention heads, 16 layers, 12,480 singular vectors. Top-20% component nullification for concept removal.
- **SDXL**: 70 cross-attention layers, 83,200 singular vectors (6.67× increase). Concepts distribute more broadly, requiring 20–30% removal, but subspace localization is preserved.
- **Computational cost**: Full SVD decomposition for 4 prompt pairs takes **33 seconds** on a single A100 GPU. Cached decomposition size is 2.17GB. No additional training required.

---
