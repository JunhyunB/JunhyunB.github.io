---
title: "Mechanistic Dissection of Cross-Attention Subspaces in Text-to-Image Diffusion Models"
date: 2026-01-20
draft: false
tags: ["mechanistic-interpretability", "diffusion-models", "cross-attention"]
summary: "AAAI 2026 — Jun-Hyun Bae, Wonyong Jo, Jaehyup Lee, Heechul Jung"
cover:
  image: "/videos/aaai2026-ov-circuits.jpg"
  alt: "Spectral Modulation of Cross-Attention OV Circuits"
  hidden: true
ShowToc: false
ShowReadingTime: false
ShowShareButtons: false
hideMeta: true
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

{{< video src="/videos/aaai2026-ov-circuits.mp4" poster="/videos/aaai2026-ov-circuits.jpg" caption="Cross-Attention OV 행렬의 SVD 부분공간 기하학과 재학습 없는 개념 제어(Eq. 9)" >}}

## Abstract

Text-to-image diffusion models utilize cross-attention to integrate textual information into the visual latent space, yet the transformation from text embeddings to latent features remains largely unexplored. We provide a mechanistic analysis of the output-value (OV) circuits within cross-attention layers through spectral analysis via singular value decomposition. Our analysis demonstrates that semantic concepts are encoded in low-dimensional subspaces spanned by singular vectors in OV circuits across cross-attention heads. To verify this, we intervene on concept-related components in the diffusion process, demonstrating that intervention on identified spectral components affects conceptual changes. We further validate these findings by examining visual outputs of isolated subspaces and their alignment with text embedding space. Through this mechanistic understanding, we demonstrate that simply nullifying these spectral components can achieve targeted concept removal with performance comparable to existing methods while providing interpretability. Our work reveals how cross-attention layers encode semantic concepts in spectral subspaces of OV circuits, providing mechanistic insights and enabling precise concept manipulation without retraining.

---

## Overview

Stable Diffusion의 cross-attention에서 Van Gogh, Monet, Picasso는 같은 head를 공유하면서도 서로 다른 singular vector에 높은 기여도를 보였다. 여기서는 각 head 내부의 OV 변환을 분해해 이런 개념별 차이를 분석한다.

OV 행렬을 SVD로 분해하고, “a mountain”과 “a mountain in Van Gogh style”처럼 개념 유무만 다른 prompt 쌍을 비교한다. 두 prompt 사이에서 반응이 크게 달라지는 성분을 골라 줄이거나 증폭하면, 생성 이미지의 화풍도 달라진다. 화풍 관련 OV 성분만 남기는 실험에서는 장면의 세부 내용이 사라진 뒤에도 붓질과 형태가 남았다. Nudity 관련 성분을 제거하는 데도 같은 분석을 적용했다.

![Spectral Isolation](/images/aaai2026/fig3-spectral-isolation.webp)

<p class="caption">
개념별 spectral isolation. 각 개념마다 윗줄은 개념 관련 component를 제거한 결과, 아랫줄은 그 component만 남긴 결과다(상위 k%). 스타일 개념(Van Gogh, Picasso)은 장면 내용과 분리된 붓질·입체파 형태 같은 스타일 패턴만 남는 반면, 콘텐츠 개념(nudity)은 인체 형태를 통째로 재구성하는 holistic한 표현을 보인다. 이는 모델이 개념 유형에 따라 질적으로 다른 인코딩 방식을 사용함을 시사한다.
</p>

---

## Method

Cross-attention이 residual stream에 더하는 출력은 두 회로로 분해된다. QK circuit은 attention 가중치를 계산해 각 위치가 어떤 텍스트 토큰을 참조할지 정하고, OV circuit $\mathbf{W}_{\text{OV}} = \mathbf{W}_{\text{V}}\mathbf{W}_{\text{O}}$는 참조한 토큰의 의미를 어떤 시각 특징으로 바꿀지 정한다. Attention 패턴은 denoising 과정에서 계속 바뀌지만 OV 변환은 고정된 선형 사상이어서, 텍스트가 시각 특징으로 번역되는 과정을 정적으로 분석하기에 적합하다.

Text embedding은 의미 정보를 고유한 축(semantic axes)을 따라 조직한다고 알려져 있다. 따라서 이 공간을 시각 특징으로 선형 변환하는 $\mathbf{W}_{\text{OV}}$ 역시 그 축에 정렬된 subspace를 학습했을 것이라는 가설에서 출발한다. 각 head $h$의 OV 행렬을 SVD로 분해하면 다음과 같다.

$$\mathbf{W}_{\text{OV}}^{(h)} = \sum_{i=1}^{r} \textcolor{#A86A14}{\sigma_i^{(h)}} \, \textcolor{#1E4E79}{\mathbf{u}_i^{(h)}} \, (\textcolor{#2A6F4E}{\mathbf{v}_i^{(h)}})^\top$$

각 rank-1 성분(spectral component)은 text embedding 공간의 방향 $\mathbf{u}_i$를 head 출력 공간의 방향 $\mathbf{v}_i$로 세기 $\sigma_i$만큼 옮기는, 독립된 text-to-visual 변환 경로다. “Van Gogh 스타일”이나 “nudity” 같은 의미 개념은 전체 spectrum 중 소수의 component에 집중되어 있다.

### 개념 기여도 측정

개념이 어디에 인코딩되는지 찾기 위해, 개념 유무만 다른 prompt 쌍(예: “a mountain”과 “a mountain in Van Gogh style”)을 비교한다. 각 prompt의 token embedding을 평균한 $\bar{\mathbf{c}}$를 head $h$의 singular vector에 투영하고 singular value를 곱해 $\mathbf{s}^{(h)}(\bar{\mathbf{c}}) = \bar{\mathbf{c}}\,\mathbf{U}^{(h)}\mathbf{\Sigma}^{(h)}$를 얻는다. 두 prompt 사이에서 이 값이 크게 달라지는 성분을 개념에 많이 기여하는 후보로 본다.

$$\textcolor{#B84327}{\Delta\mathbf{s}^{(h)}} = \mathbf{s}^{(h)}(\textcolor{#1E4E79}{\bar{\mathbf{c}}_{\text{concept}}}) - \mathbf{s}^{(h)}(\textcolor{#1E4E79}{\bar{\mathbf{c}}_{\text{base}}}), \qquad [\textcolor{#B84327}{\Delta\mathbf{s}^{(h)}}]_i = \textcolor{#A86A14}{\sigma_i^{(h)}} \langle \textcolor{#B84327}{\bar{\mathbf{c}}_{\text{concept}} - \bar{\mathbf{c}}_{\text{base}}},\, \textcolor{#1E4E79}{\mathbf{u}_i^{(h)}} \rangle$$

벡터 전체의 크기 $\|\Delta\mathbf{s}^{(h)}\|_2$는 head의 개념 기여도이고, 각 원소의 크기 $|[\Delta\mathbf{s}^{(h)}]_i|$는 개별 spectral component의 기여도다.

먼저 head 단위로 보면, 개념 기여도가 가장 높은 상위 20개 head(SD v2.1 전체 195개 중 약 10%)의 출력만 스케일링해도 개념의 강도가 조절된다.

![Head Modulation](/images/aaai2026/fig1-vangogh-modulation.webp)

<p class="caption">
"Van Gogh" 개념 기여도 상위 20개 head(전체 195개 중 약 10%)의 출력을 $\alpha$배로 스케일링한 결과.
</p>

### Head에서 subspace로

Head 단위 분석은 어떤 head가 개념에 기여하는지는 알려주지만, 개념이 head 안에서 어떻게 조직되는지는 보여주지 않는다. 신경망의 한 구성 요소가 여러 특징을 함께 인코딩하는 polysemanticity를 고려하면, 개념이 head 전체를 쓰는지 아니면 head 안의 특정 spectral component에 국한되는지가 질문이 된다. 이를 보기 위해 모든 head의 모든 component를 기여도 $|[\Delta\mathbf{s}^{(h)}]_i|$로 정렬하고, 상위 $k$%를 그 개념의 spectral signature $\mathcal{S}_c$로 삼아 이 component만 스케일링한다.

$$\widetilde{\mathbf{W}}_{\text{OV}}^{(h)} = \mathbf{W}_{\text{OV}}^{(h)} + (\textcolor{#B84327}{\alpha} - 1) \sum_{i:\,(h,i) \in \textcolor{#B84327}{\mathcal{S}_c}} \textcolor{#A86A14}{\sigma_i^{(h)}} \, \textcolor{#1E4E79}{\mathbf{u}_i^{(h)}} \, (\textcolor{#2A6F4E}{\mathbf{v}_i^{(h)}})^\top$$

{{< ov-svd-widget >}}

$\alpha = 0$이면 선택한 component를 지우고(Spectral Nullification), $\alpha = 1$이면 원래 모델 그대로이며, $\alpha > 1$이면 해당 component의 기여를 키운다. SD v2.1의 정성 실험에서는 개념 기여도 상위 15–20%를 제거했을 때 목표 개념이 억제되는 예시를 확인했다. 반면 30% 이상 제거하면 전반적인 생성 품질도 떨어질 수 있었다.

아래 그림은 기여도가 높은 head 전체(상위 10%)를 조절하는 경우와, head 내부의 spectral component(상위 10%)를 골라 조절하는 경우를 비교한다. Head 내부를 더 세밀하게 나누었을 때 개념을 조절하는 방식이 어떻게 달라지는지 보여준다.

![Spectral vs Head](/images/aaai2026/fig2-spectral-vs-head.webp)

<p class="caption">
Spectral modulation(위, 전체 component 중 개념 기여도 상위 10%)과 head-level modulation(아래, 기여도 상위 10% head)을 $\alpha$를 바꿔 가며 비교한 결과.
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

SN은 I2P에서 RECE와 공동 2위(4.24%), MMA·P4D·UnLearnDiffAtk에서 각각 2위를 기록한다. 표에 포함된 training-based 방법(ESD, CA, MACE, SDID)보다 모든 벤치마크에서 ASR이 낮지만, Ring-A-Bell에서는 UCE·RECE·SLD-Strong보다 높다. 따라서 성능은 공격 프롬프트의 구성에 따라 달라진다.

SN은 앞서 분석한 개념별 성분을 OV 행렬에서 추가 학습 없이 제거한다. 제거 성능과 텍스트–이미지 일치도의 균형은 COCO 캡션 1,000개에 대한 CLIP score로 평가했다.

![Quality Tradeoff](/images/aaai2026/fig7-quality-tradeoff.webp)

<p class="caption">
Concept removal 성능(P4D ASR)과 텍스트–이미지 일치도(CLIP score)의 관계. SN은 재학습 없이 경쟁력 있는 균형을 보인다. SLD-Strong은 ASR이 가장 낮지만 CLIP score도 낮아진다.
</p>

### Spectral Subspace의 의미 검증

식별된 spectral subspace가 실제로 해당 개념의 의미를 포착하고 있는지를 두 가지 방식으로 검증한다.

**텍스트 공간 정렬**: 개념 prompt와 base prompt의 text embedding 차이 벡터를 concept-specific spectral component의 입력 방향으로 재구성한 뒤, CLIP 어휘 49,408개 토큰 전체와의 cosine similarity를 계산한다. Nudity 개념의 기여도 상위 2개 head를 보면, 한 head에서는 “nudes”, “nsfw”, “naked”가, 다른 head에서는 “topless”, “lingerie”, “erotica”, “nude”가 유사도 상위 16개에 포함된다. Head마다 목록은 다르지만 모두 개념과 관련된 토큰이 나타나며, 일부 무관한 토큰도 함께 섞여 있다.

![Token Alignment](/images/aaai2026/fig6-token-alignment.webp)

<p class="caption">
Nudity 관련 spectral component로 재구성한 벡터와 cosine similarity가 가장 높은 16개 토큰(기여도 상위 2개 head). 음영 표시된 토큰이 nudity와 직접 관련된 토큰이다.
</p>

**개입 전후의 표현(t-SNE)과 개념 간 겹침(Jaccard)**: 개념 관련 component를 제거하면, head output의 t-SNE에서 base/concept prompt 클러스터가 더 많이 겹친다. Jaccard similarity에서는 Van Gogh와 Monet처럼 유사한 개념들이 성분을 더 많이 공유하면서도 서로 구별되는 spectral signature를 갖는 모습을 확인한다.

![t-SNE Jaccard](/images/aaai2026/fig4-tsne-jaccard.webp)

<p class="caption">
(a) 개념 기여도 상위 10% component 제거 전후의 head output t-SNE. 제거 후 base/concept 클러스터의 겹침이 늘어난다. (b) 개념 간 Jaccard similarity. 유사한 개념끼리 겹치지만, 서로 구별되는 signature를 보인다.
</p>

### Qualitative

아래 I2P adversarial prompt 예시에서 SN은 장면 구성을 유지하면서 목표 콘텐츠를 억제한다.

![I2P Comparison](/images/aaai2026/fig8-i2p-comparison.webp)

<p class="caption">
I2P adversarial prompt에 대한 생성 결과 비교. 왼쪽부터 SD v1.4(원본), CA, RECE, SLD-Medium, SLD-Strong, SAFREE, SN(Ours).
</p>

---

## Presentation

<div class="paper-video-stage" style="max-width: 720px; margin: 0 auto 2rem; aspect-ratio: 3/2;">
<iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" src="https://underline.io/embed/140292-mechanistic-dissection-of-cross-attention-subspaces-in-text-to-image-diffusion-models?t=0" title="Mechanistic Dissection of Cross-Attention Subspaces in Text-to-Image Diffusion Models" loading="lazy" allowfullscreen></iframe>
</div>

---
