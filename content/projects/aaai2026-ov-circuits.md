---
title: "Mechanistic Dissection of Cross-Attention Subspaces in T2I Diffusion Models"
date: 2026-01-20
draft: false
tags: ["mechanistic-interpretability", "diffusion-models", "cross-attention"]
summary: "AAAI 2026 — Jun-Hyun Bae, Wonyong Jo, Jaehyup Lee, Heechul Jung"
cover:
  image: "/images/aaai2026/fig3-spectral-isolation.webp"
  alt: "Spectral Isolation"
  hidden: true
ShowToc: false
ShowReadingTime: false
ShowShareButtons: false
hideMeta: true
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

Cross-attention의 OV circuit이 텍스트를 어떻게 시각 특징으로 변환하는지 밝히고, 이를 활용해 재학습 없이 개념을 제거하는 방법을 제안한다.

1. **Spectral Decomposition** — $\mathbf{W}_{\text{OV}}$를 SVD로 분해하여 독립적인 text-to-visual 변환 경로를 추출한다.
2. **Concept Localization** — "고흐 스타일", "nudity" 등의 의미 개념이 전체 spectrum 중 소수의 spectral component에 집중되어 있음을 발견한다.
3. **Spectral Nullification** — 해당 component만 제거하면 재학습 없이도 기존 방법과 비슷한 수준의 targeted concept removal이 가능하다.

![Spectral Isolation](/images/aaai2026/fig3-spectral-isolation.webp)

<p class="caption">
각 개념의 spectral component만 활성화한 결과. 스타일 개념(Van Gogh, Picasso)은 질감·색감 등 시각 패턴으로 분해되는 반면, 콘텐츠 개념(Nudity)은 인체 형태를 포함하는 holistic한 표현을 보인다. 이는 모델이 개념 유형에 따라 질적으로 다른 인코딩 방식을 사용함을 시사한다.
</p>

---

## Method

Cross-attention에서 텍스트를 시각 특징으로 변환하는 핵심은 $\mathbf{W}_{\text{OV}}$ 행렬이다. Text embedding은 의미 정보를 고유한 축(semantic axes)을 따라 조직하는데, $\mathbf{W}_{\text{OV}}$는 이 축에 정렬된 저차원 subspace를 통해 개념별 변환을 수행한다. 이 행렬을 SVD로 분해하면 각 spectral component가 text-to-visual의 독립된 변환 경로가 되며, "고흐 스타일"이나 "nudity" 같은 의미 개념은 **전체 spectrum 중 소수의 component에 집중**되어 있다.

특정 개념에 대해 high-contribution head는 전체의 약 10%에 불과하며, 해당 head의 출력을 스케일링하면 개념의 강도를 조절할 수 있다.

![Head Modulation](/images/aaai2026/fig1-vangogh-modulation.webp)

<p class="caption">
"Van Gogh" 개념의 high-contribution head(전체의 ~10%) 출력을 $\alpha$로 스케일링.
</p>

그러나 head 수준의 조작은 **정밀도에 한계**가 있다. 하나의 attention head가 여러 개념을 동시에 인코딩하고 있으므로(polysemanticity), head 전체를 스케일링하면 의도하지 않은 개념까지 함께 변한다. Spectral component 단위로 조작하면 이 문제를 해결할 수 있으며, 스타일과 콘텐츠처럼 서로 다른 개념 차원을 분리하여 독립적으로 조절할 수 있다.

![Spectral vs Head](/images/aaai2026/fig2-spectral-vs-head.webp)

<p class="caption">
Spectral modulation (위) vs head-level modulation (아래). Head 전체를 조작하면 개념 외의 것도 같이 바뀌지만, spectral component 단위로 조작하면 해당 개념만 정밀하게 제어된다.
</p>

아래 그림은 전체 head에 걸친 concept contribution의 분포를 보여준다. 대부분의 head는 특정 개념에 거의 기여하지 않으며, 소수의 head만이 높은 기여를 보인다. 또한 같은 head 안에서도 Van Gogh, Monet, Picasso는 서로 다른 singular vector를 활성화하며, 높은 기여를 하는 singular vector가 반드시 singular value가 큰 것(낮은 인덱스)은 아니다. 개념마다 고유한 활성화 패턴을 보인다.

![Head Distribution](/images/aaai2026/fig5-head-distribution.webp)

<p class="caption">
Head별 concept contribution 분포. 소수의 high-contribution head에 개념 정보가 집중되어 있다.
</p>

---

## Results

### Concept Removal Benchmark

Spectral Nullification(SN)의 NSFW 개념 제거 성능을 5개 adversarial prompt 벤치마크에서 평가한다. Ring-A-Bell(K16, K38, K77)과 I2P·MMA·P4D·UnLearnDiffAtk을 포함하며, 평가 메트릭은 Attack Success Rate (ASR, 낮을수록 좋음)이다.

<p class="caption">Adversarial benchmark 전반의 Attack Success Rate (%, ↓)와 생성 품질(FID↓, COCO 캡션 1,000개). ASR 열의 최저값은 <strong>bold</strong>, 2위는 <u>underline</u>. 방법 유형은 배경색으로 구분한다 — 회색: training-based, 파랑: closed-form, 초록: inference-time, 진한 파랑: spectral.</p>

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

SN은 I2P에서 RECE와 동률(4.2%), MMA·P4D·UnLearnDiffAtk에서 각각 2위를 기록한다. 전체 1위인 SLD-Strong은 inference-time guidance로 생성 과정 전반에 개입하는 방법이며, SN은 **추가 학습 없이 행렬의 spectral component만 제거**하는 것이므로 접근 방식이 근본적으로 다르다. 특히 SN이 추가 학습 없이 테이블의 모든 training-based 방법(ESD, CA, MACE, SDID)을 능가한다는 점이 주목할 만하다. 생성 품질 측면에서도 SN은 FID 40.67로 기존 방법들과 동등한 수준을 유지하여, 품질-제거 trade-off에서 경쟁력을 보인다.

![Quality Tradeoff](/images/aaai2026/fig7-quality-tradeoff.webp)

<p class="caption">
Concept removal 성능(P4D ASR) vs 생성 품질(CLIP score). SN은 재학습 없이 기존 방법과 비슷한 trade-off를 달성한다. SLD-Strong이 ASR은 가장 낮지만, 생성 품질도 함께 하락한다.
</p>

### Spectral Subspace의 의미 검증

식별된 spectral subspace가 실제로 해당 개념의 의미를 포착하고 있는지를 두 가지 방식으로 검증한다.

**텍스트 공간 정렬**: Concept-specific spectral component로 텍스트 차이 벡터를 reconstruction한 뒤, CLIP 어휘 49,408개 토큰과의 cosine similarity를 비교한다. Nudity 개념의 경우 "nude", "naked", "topless", "erotica", "nsfw" 등이 상위에 정렬되며, spectral subspace가 해당 의미를 정확히 포착하고 있음을 확인할 수 있다.

![Token Alignment](/images/aaai2026/fig6-token-alignment.webp)

<p class="caption">
Concept spectral component로 reconstruction한 벡터와 CLIP 어휘의 cosine similarity. 해당 개념의 토큰들이 상위에 정렬된다.
</p>

**인과적 검증(t-SNE) 및 개념 간 구조(Jaccard)**: 개념 관련 spectral component를 제거하면, head output의 t-SNE에서 base/concept prompt 클러스터가 합쳐진다. 이는 해당 component들이 실제로 개념을 인코딩하고 있음을 보여주는 인과적 증거이다. Jaccard similarity 분석에서는 의미적으로 유사한 개념(Van Gogh↔Monet)이 spectral component를 더 많이 공유하면서도, 각 개념은 고유한 spectral signature를 유지하는 것으로 나타난다.

![t-SNE Jaccard](/images/aaai2026/fig4-tsne-jaccard.webp)

<p class="caption">
(a) Spectral component 제거 전후의 t-SNE. 제거 후 base/concept 클러스터가 합쳐진다. (b) 개념 간 Jaccard similarity. 유사한 개념끼리 겹치지만, 각 개념은 고유한 signature를 유지한다.
</p>

### Qualitative

I2P benchmark의 adversarial prompt에 대해 SN을 적용한 결과, 부적절한 콘텐츠가 효과적으로 제거된다.

![I2P Comparison](/images/aaai2026/fig8-i2p-comparison.webp)

<p class="caption">
I2P benchmark adversarial prompt 결과. 왼쪽: SD v1.4 (SN 적용 전), 오른쪽: SN 적용 후.
</p>

### Scalability & Practical Notes

- **SD v2.1**: 195개 cross-attention head, 16개 layer, 12,480개 singular vector. Top-20% component nullification으로 개념 제거.
- **SDXL**: 70개 cross-attention layer, 83,200개 singular vector (6.67배 증가). 개념이 더 넓게 분포하여 20–30% 제거가 필요하지만, subspace localization은 유지된다.
- **계산 비용**: 4개 prompt pair에 대한 전체 SVD 분해가 A100 GPU에서 **33초**. 분해된 행렬 캐시 크기 2.17GB. 추가 학습 없음.

---
