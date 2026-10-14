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

Text-to-image diffusion models utilize cross-attention to integrate textual information into the visual latent space, yet the transformation from text embeddings to latent features remains largely unexplored. We provide a mechanistic analysis of the output-value (OV) circuits within cross-attention layers through spectral analysis via singular value decomposition. Our analysis demonstrates that semantic concepts are encoded in low-dimensional subspaces spanned by singular vectors in OV circuits across cross-attention heads. To verify this, we intervene on concept-related components in the diffusion process, demonstrating that intervention on identified spectral components affects conceptual changes. We further validate these findings by examining visual outputs of isolated subspaces and their alignment with text embedding space. Through this mechanistic understanding, we demonstrate that simply nullifying these spectral components can achieve targeted concept removal with performance comparable to existing methods while providing interpretability. Our work reveals how cross-attention layers encode semantic concepts in spectral subspaces of OV circuits, providing mechanistic insights and enabling precise concept manipulation without retraining.

---

## Overview

Cross-attention의 OV circuit이 텍스트를 어떻게 시각 특징으로 변환하는지 밝히고, 이를 활용해 재학습 없이 개념을 제거하는 방법을 제안한다.

1. **Spectral Decomposition** — $\mathbf{W}_{\text{OV}}$를 SVD로 분해하여 독립적인 text-to-visual 변환 경로를 추출한다.
2. **Concept Localization** — "Van Gogh 스타일", "nudity" 등의 의미 개념이 전체 spectrum 중 소수의 spectral component에 집중되어 있음을 발견한다.
3. **Spectral Nullification** — 해당 component만 제거하면 재학습 없이도 기존 방법과 비슷한 수준의 targeted concept removal이 가능하다.

![Spectral Isolation](/images/aaai2026/fig3-spectral-isolation.webp)

<p class="caption">
개념별 spectral isolation. 각 개념마다 윗줄은 개념 관련 component를 제거한 결과, 아랫줄은 그 component만 남긴 결과다(상위 k%). 스타일 개념(Van Gogh, Picasso)은 장면 내용과 분리된 붓질·입체파 형태 같은 스타일 패턴만 남는 반면, 콘텐츠 개념(nudity)은 인체 형태를 통째로 재구성하는 holistic한 표현을 보인다. 이는 모델이 개념 유형에 따라 질적으로 다른 인코딩 방식을 사용함을 시사한다.
</p>

---

## Method

Cross-attention이 residual stream에 더하는 출력은 두 회로로 분해된다. QK circuit은 attention 가중치를 계산해 각 위치가 어떤 텍스트 토큰을 참조할지 정하고, OV circuit $\mathbf{W}_{\text{OV}} = \mathbf{W}_{\text{V}}\mathbf{W}_{\text{O}}$는 참조한 토큰의 의미를 어떤 시각 특징으로 바꿀지 정한다. Attention 패턴은 denoising 과정에서 계속 바뀌지만 OV 변환은 고정된 선형 사상이어서, 텍스트가 시각 특징으로 번역되는 과정을 정적으로 분석하기에 적합하다.

Text embedding은 의미 정보를 고유한 축(semantic axes)을 따라 조직한다고 알려져 있다. 따라서 이 공간을 시각 특징으로 선형 변환하는 $\mathbf{W}_{\text{OV}}$ 역시 그 축에 정렬된 subspace를 학습했을 것이라는 가설에서 출발한다. 각 head $h$의 OV 행렬을 SVD로 분해하면 다음과 같다.

$$\mathbf{W}_{\text{OV}}^{(h)} = \sum_{i=1}^{r} \sigma_i^{(h)} \mathbf{u}_i^{(h)} (\mathbf{v}_i^{(h)})^\top$$

각 rank-1 성분(spectral component)은 text embedding 공간의 방향 $\mathbf{u}_i$를 head 출력 공간의 방향 $\mathbf{v}_i$로 세기 $\sigma_i$만큼 옮기는, 독립된 text-to-visual 변환 경로다. “Van Gogh 스타일”이나 “nudity” 같은 의미 개념은 **전체 spectrum 중 소수의 component에 집중**되어 있다.

### 개념 기여도 측정

개념이 어디에 인코딩되는지 찾기 위해, 개념 유무만 다른 prompt 쌍(예: “a mountain”과 “a mountain in Van Gogh style”)을 비교한다. 각 prompt의 token embedding을 평균한 $\bar{\mathbf{c}}$를 head $h$의 singular vector로 나타낸 $\mathbf{s}^{(h)}(\bar{\mathbf{c}}) = \bar{\mathbf{c}}\,\mathbf{U}^{(h)}\mathbf{\Sigma}^{(h)}$는 그 head의 출력을 직접 결정한다. 두 prompt에 대한 이 표현의 차이가 개념의 기여를 나타낸다.

$$\Delta\mathbf{s}^{(h)} = \mathbf{s}^{(h)}(\bar{\mathbf{c}}_{\text{concept}}) - \mathbf{s}^{(h)}(\bar{\mathbf{c}}_{\text{base}}), \qquad [\Delta\mathbf{s}^{(h)}]_i = \sigma_i^{(h)} \langle \bar{\mathbf{c}}_{\text{concept}} - \bar{\mathbf{c}}_{\text{base}},\, \mathbf{u}_i^{(h)} \rangle$$

벡터 전체의 크기 $\|\Delta\mathbf{s}^{(h)}\|_2$는 head의 개념 기여도이고, 각 원소의 크기 $|[\Delta\mathbf{s}^{(h)}]_i|$는 개별 spectral component의 기여도다.

먼저 head 단위로 보면, 개념 기여도가 가장 높은 상위 20개 head(SD v2.1 전체 195개 중 약 10%)의 출력만 스케일링해도 개념의 강도가 조절된다.

![Head Modulation](/images/aaai2026/fig1-vangogh-modulation.webp)

<p class="caption">
"Van Gogh" 개념 기여도 상위 20개 head(전체 195개 중 약 10%)의 출력을 $\alpha$배로 스케일링한 결과.
</p>

### Head에서 subspace로

Head 단위 분석은 어떤 head가 개념에 기여하는지는 알려주지만, 개념이 head 안에서 어떻게 조직되는지는 보여주지 않는다. 신경망의 한 구성 요소가 여러 특징을 함께 인코딩하는 polysemanticity를 고려하면, 개념이 head 전체를 쓰는지 아니면 head 안의 특정 spectral component에 국한되는지가 질문이 된다. 이를 보기 위해 모든 head의 모든 component를 기여도 $|[\Delta\mathbf{s}^{(h)}]_i|$로 정렬하고, 상위 $k$%를 그 개념의 spectral signature $\mathcal{S}_c$로 삼아 이 component만 스케일링한다.

$$\widetilde{\mathbf{W}}_{\text{OV}}^{(h)} = \mathbf{W}_{\text{OV}}^{(h)} + (\alpha - 1) \sum_{i:\,(h,i) \in \mathcal{S}_c} \sigma_i^{(h)} \mathbf{u}_i^{(h)} (\mathbf{v}_i^{(h)})^\top$$

$\alpha = 0$이면 개념 component를 지우고(Spectral Nullification), $\alpha = 1$이면 원래 모델 그대로이며, $\alpha > 1$이면 개념이 증폭된다. SD v2.1에서는 개념 관련 component 상위 15–20%만 제거해도 생성 이미지에서 개념이 사라지지만, 30% 이상 제거하면 전반적인 생성 품질이 떨어질 수 있다.

아래 그림은 같은 10%를 조작하더라도 head 전체를 스케일링할 때와 spectral component만 스케일링할 때 결과가 달라지는 것을 보여준다. 개념이 head 전체가 아니라 특정 spectral subspace에 국한되어 있어, spectral 분석으로 개념 component를 정밀하게 찾아 조작할 수 있다는 뜻이다.

![Spectral vs Head](/images/aaai2026/fig2-spectral-vs-head.webp)

<p class="caption">
Spectral modulation(위, $\mathcal{S}_c$의 component 10%)과 head-level modulation(아래, 기여도 상위 10% head)을 $\alpha$를 바꿔 가며 비교한 결과.
</p>

아래 그림은 Van Gogh, Monet, Picasso 세 개념 모두에서 기여도가 높은 head들을 골라, head 안의 singular vector별 기여도를 나타낸 것이다. 같은 head 안에서도 세 개념은 서로 다른 singular vector를 활성화하며, 높은 기여를 하는 singular vector가 반드시 singular value가 큰 것(낮은 인덱스)은 아니다. 즉 개념들은 head를 공유하면서도, 부분적으로 겹치지만 구별되는 고유한 활성화 패턴을 가진다.

![Head Distribution](/images/aaai2026/fig5-head-distribution.webp)

<p class="caption">
세 화풍 개념에서 공통으로 기여도가 높은 head들의 singular vector별 기여도. 같은 head 안에서도 개념마다 서로 다른 singular vector가 활성화된다.
</p>

---

## Results

### Concept Removal Benchmark

Spectral Nullification(SN)의 nudity 개념 제거 성능을 SD v1.4에서 5개 adversarial prompt 벤치마크로 평가한다. 벤치마크는 Ring-A-Bell(K16, K38, K77)과 I2P·MMA·P4D·UnLearnDiffAtk이고, SN은 앞의 관찰에 따라 개념 관련 spectral component 상위 20%를 제거한다. 평가 지표는 NudeNet으로 측정한 Attack Success Rate(ASR, 낮을수록 좋음)이다.

<p class="caption">Nudity 관련 콘텐츠에 대한 adversarial benchmark별 Attack Success Rate (%, ↓). 열별 최저값은 <strong>bold</strong>, 2위는 <u>underline</u>. 방법 유형은 배경색으로 구분한다 — 회색: training-based, 파랑: closed-form, 초록: inference-time, 진한 파랑: spectral.</p>

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

SN은 I2P에서 RECE와 공동 2위(4.24%), MMA·P4D·UnLearnDiffAtk에서 각각 2위를 기록하고, 추가 학습 없이도 모든 벤치마크에서 training-based 방법(ESD, CA, MACE, SDID)보다 ASR이 낮다. 반면 Ring-A-Bell에서는 30.53–41.05%로 closed-form 방법(UCE, RECE)과 SLD-Strong보다 높다. 벤치마크에 따라 결과가 I2P의 4.24%부터 Ring-A-Bell K16의 41.05%까지 벌어지는 것은 adversarial prompt의 설계와 공격 강도 차이를 반영한다. 대부분의 벤치마크에서 1위인 SLD-Strong은 inference-time guidance로 생성 과정 전반에 개입하는 방법이며, SN은 **추가 학습 없이 행렬의 spectral component만 제거**하는 것이므로 접근 방식이 근본적으로 다르다. 생성 품질은 COCO 캡션 1,000개에 대한 CLIP score로 평가하며, 아래 그림처럼 SN은 제거 성능과 생성 품질 사이의 trade-off에서 경쟁력 있는 위치에 있다.

![Quality Tradeoff](/images/aaai2026/fig7-quality-tradeoff.webp)

<p class="caption">
Concept removal 성능(P4D ASR) vs 생성 품질(CLIP score). SN은 재학습 없이 기존 방법과 비슷한 trade-off를 달성한다. SLD-Strong이 ASR은 가장 낮지만, 생성 품질도 함께 하락한다.
</p>

### Spectral Subspace의 의미 검증

식별된 spectral subspace가 실제로 해당 개념의 의미를 포착하고 있는지를 두 가지 방식으로 검증한다.

**텍스트 공간 정렬**: 개념 prompt와 base prompt의 text embedding 차이 벡터를 concept-specific spectral component만으로 재구성한 뒤, CLIP 어휘 49,408개 토큰 전체와의 cosine similarity를 계산한다. Nudity 개념의 경우 기여도 상위 2개 head 모두에서 "nude", "naked", "topless", "erotica", "nsfw" 같은 토큰이 상위 16개 안에 들어, 이 subspace가 해당 개념의 의미를 담고 있음을 보여준다. 다만 nudity와 직접 관련 없는 토큰도 섞여 있어, subspace가 개념 하나만 깔끔하게 분리하기보다 의미적으로 인접한 영역까지 함께 담는다는 점(polysemanticity)도 드러난다.

![Token Alignment](/images/aaai2026/fig6-token-alignment.webp)

<p class="caption">
Nudity 관련 spectral component로 재구성한 벡터와 cosine similarity가 가장 높은 16개 토큰(기여도 상위 2개 head). 음영 표시된 토큰이 nudity와 직접 관련된 토큰이다.
</p>

**인과적 검증(t-SNE) 및 개념 간 구조(Jaccard)**: 개념 관련 spectral component를 제거하면, head output의 t-SNE에서 base/concept prompt 클러스터가 합쳐진다. 이는 해당 component들이 실제로 개념을 인코딩하고 있음을 보여주는 인과적 증거이다. Jaccard similarity 분석에서는 의미적으로 유사한 개념(Van Gogh↔Monet)이 spectral component를 더 많이 공유하면서도, 각 개념은 고유한 spectral signature를 유지하는 것으로 나타난다.

![t-SNE Jaccard](/images/aaai2026/fig4-tsne-jaccard.webp)

<p class="caption">
(a) 개념 관련 spectral component 상위 10%를 제거하기 전후의 head output t-SNE. 제거 후 base/concept 클러스터가 합쳐진다. (b) 개념 간 Jaccard similarity. 유사한 개념끼리 겹치지만, 각 개념은 고유한 signature를 유지한다.
</p>

### Qualitative

I2P benchmark의 adversarial prompt로 기존 방법들과 SN의 생성 결과를 비교하면, SN은 장면 구성을 유지하면서 부적절한 콘텐츠를 제거한다.

![I2P Comparison](/images/aaai2026/fig8-i2p-comparison.webp)

<p class="caption">
I2P adversarial prompt에 대한 생성 결과 비교. 왼쪽부터 SD v1.4(원본), CA, RECE, SLD-Medium, SLD-Strong, SAFREE, SN(Ours).
</p>

---
