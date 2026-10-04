---
title: "Cross-Attention 안에서 개념은 어떻게 인코딩될까? — AAAI 2026 논문 해설"
date: 2026-02-07
draft: true
tags: ["mechanistic-interpretability", "diffusion-models", "cross-attention", "aaai"]
summary: "Text-to-Image 디퓨전 모델의 OV circuit을 SVD로 분해해서, 의미 개념이 어디에 숨어있는지 찾아낸 이야기."
ShowToc: true
TocOpen: true
math: true
cover:
  image: "/images/aaai2026/fig3-spectral-isolation.webp"
  alt: "Spectral Isolation"
  hidden: true
---

> **Paper**: *Mechanistic Dissection of Cross-Attention Subspaces in Text-to-Image Diffusion Models*
> **Authors**: Jun-Hyun Bae, Wonyong Jo, Jaehyup Lee, Heechul Jung (KNU)
> **Venue**: AAAI 2026
> **Code**: [github.com/JunhyunB/diffusion-ov-circuits](https://github.com/JunhyunB/diffusion-ov-circuits)

---

## 들어가며

Stable Diffusion 같은 text-to-image 모델에 "a cat in Van Gogh style"이라고 입력하면, 모델은 어떻게 "Van Gogh 스타일"이라는 **개념**을 알아듣고 이미지에 반영할까?

Cross-attention이 텍스트 정보를 이미지 생성 과정에 주입하는 역할을 한다는 건 이미 잘 알려져 있다. 하지만 그 내부에서 **어떤 변환**을 통해 "Van Gogh"라는 텍스트가 실제 시각적 특징으로 바뀌는지는 별로 연구가 안 되어 있었다.

이 논문에서 우리가 한 것은, cross-attention의 **OV circuit** (output-value 행렬)을 SVD로 분해해서, 의미 개념이 특정한 low-dimensional subspace에 집중적으로 인코딩되어 있다는 것을 보인 것이다. 그리고 그 subspace를 직접 조작하면 해당 개념만 제거하거나 증폭할 수 있다.

개인적으로는 mechanistic interpretability를 NLP transformer 바깥으로 확장하는 작업이 재미있었다. Diffusion model도 결국 transformer 기반이니 비슷한 도구가 통하지 않을까 하는 직감이 맞아떨어졌다.

---

## 배경: Cross-Attention의 두 회로

디퓨전 모델의 cross-attention은 수학적으로 두 개의 독립적인 회로로 분리된다:

$$\Delta\mathbf{z} = \underbrace{\mathbf{A}(\mathbf{z}, \mathbf{c})}_{\text{QK Circuit}} \cdot \underbrace{\mathbf{c} \, \mathbf{W}\_{\text{OV}}}_{\text{OV Circuit}}$$

- **QK circuit**: "어디에 attention을 줄지" — 공간적 배치를 결정
- **OV circuit**: "어떤 의미를 전달할지" — 텍스트 임베딩을 시각적 특징으로 변환

이 분해는 Anthropic의 [Transformer Circuits](https://transformer-circuits.pub/2021/framework/index.html) 프레임워크에서 가져온 아이디어인데, 보통 language model에 적용하던 것이다. 우리는 이걸 diffusion model의 cross-attention에 적용했다.

핵심 관찰: **QK circuit은 denoising 과정에서 계속 바뀌지만, OV circuit ($\mathbf{W}\_{\text{OV}} = \mathbf{W}\_V \mathbf{W}\_O$)은 고정된 행렬**이다. 고정된 행렬이니까 정적 분석이 가능하다는 게 좋은 점이다.

---

## 핵심 아이디어: SVD로 OV 행렬 분해하기

각 attention head의 OV 행렬에 SVD를 적용하면:

$$\mathbf{W}\_{\text{OV}}^{(h)} = \sum_{i=1}^{r} \sigma_i^{(h)} \, \mathbf{u}_i^{(h)} (\mathbf{v}_i^{(h)})^T$$

- $\mathbf{u}_i$: 텍스트 임베딩 공간의 방향 (왼쪽 특이벡터)
- $\mathbf{v}_i$: 시각적 출력 공간의 방향 (오른쪽 특이벡터)
- $\sigma_i$: 그 매핑의 강도 (특이값)

텍스트 임베딩이 특정 $\mathbf{u}_i$ 방향에 큰 projection을 가지면, 그에 대응하는 $\mathbf{v}_i$ 방향의 시각적 특징이 강하게 생성된다.

그러면 **"Van Gogh 스타일"이라는 개념이 어떤 $\mathbf{u}_i$ 들에 주로 projection되는지** 를 추적하면, 그 개념이 인코딩된 subspace를 찾을 수 있다.

---

## 개념이 살고 있는 Subspace 찾기

기본 프롬프트("a mountain")와 개념 프롬프트("a mountain in Van Gogh style")의 텍스트 임베딩 차이가, 각 head의 spectral representation에서 어떻게 나타나는지를 측정한다.

구체적으로, 각 singular component $(h, i)$의 기여도:

$$|[\Delta\mathbf{s}^{(h)}\_{\text{concept}}]_i| = \sigma_i^{(h)} \left| \langle \bar{\mathbf{c}}\_{\text{concept}}, \mathbf{u}_i^{(h)} \rangle - \langle \bar{\mathbf{c}}\_{\text{base}}, \mathbf{u}_i^{(h)} \rangle \right|$$

이 값이 큰 component들을 모으면 그게 **개념의 spectral signature** $\mathcal{S}_c$ 가 된다.

---

## 결과 1: Head-level vs Spectral-level 조작

![Spectral modulation vs Head modulation](/images/aaai2026/fig2-spectral-vs-head.webp)

위 그림이 논문의 핵심 결과 중 하나다. 같은 수의 component를 조작해도:
- **Head 전체를 스케일링** (아래) → 개념 외의 것도 같이 바뀜 (색감, 구도 등이 변함)
- **Spectral component만 스케일링** (위) → 해당 개념만 정밀하게 제거/증폭

이건 attention head가 **polysemantic** 하다는 뜻이다 — 하나의 head가 여러 개념을 동시에 인코딩하고 있고, SVD로 분해해야 개별 개념에 접근할 수 있다.

솔직히 이 결과가 나왔을 때 꽤 놀랐다. Language model에서 polysemanticity가 널리 알려져 있긴 하지만, diffusion model의 cross-attention에서도 이렇게 깔끔하게 나올 줄은 몰랐다.

---

## 결과 2: Spectral Isolation — 개념의 시각적 "본체"

![Spectral isolation of concepts](/images/aaai2026/fig3-spectral-isolation.webp)

이 실험이 제일 재미있었다. 개념에 해당하는 spectral component **만** 켜고 나머지를 전부 끄면, 그 개념의 "시각적 본질"이 드러난다.

- **Van Gogh / Picasso**: 순수한 스타일 패턴만 남는다 — 붓터치, 색감, 질감
- **Neon**: 가장자리의 형광 빛만 남는다
- **Nudity**: 흥미롭게도, 스타일 개념과 달리 사람 전체 형태가 함께 남는다

이 차이가 의미하는 것은, **스타일 개념은 시각적 패턴으로 분해되고, 콘텐츠 개념은 더 전체적(holistic)으로 인코딩된다**는 것이다. 개념의 종류에 따라 인코딩 방식이 다르다는 게 흥미로운 발견이었다.

---

## 결과 3: 개념 간 Subspace의 관계

![t-SNE and Jaccard similarity](/images/aaai2026/fig4-tsne-jaccard.webp)

**(a)** 개념 관련 spectral component를 제거하면, head output의 t-SNE에서 base와 concept prompt의 클러스터가 합쳐진다. → 그 component들이 진짜로 개념을 인코딩하고 있었다는 인과적 증거.

**(b)** Jaccard similarity로 개념 간 subspace 중첩도를 봤는데, 비슷한 개념끼리 (Van Gogh↔Monet) 겹치는 부분이 더 많다. 하지만 각 개념은 고유한 spectral signature를 유지한다.

이건 효율적인 인코딩 전략이다 — **의미적으로 비슷한 개념은 spectral component를 공유하되, 조합 방식으로 구분**한다.

---

## 결과 4: 같은 Head 안에서의 개념 분포

![Spectral distribution in heads](/images/aaai2026/fig5-head-distribution.webp)

같은 high-contribution head 안에서 Van Gogh, Monet, Picasso가 어떤 singular vector를 활성화하는지 본 그림이다.

주목할 점은, 큰 기여를 하는 singular vector가 꼭 singular value가 큰 것(낮은 인덱스)이 아니라는 것이다. **개념에 따라 활성화 패턴이 완전히 다르다.** 이건 단순히 "top-k singular value를 보면 된다"는 식의 접근이 안 통한다는 뜻이기도 하다.

---

## 결과 5: Spectral Subspace가 인코딩하는 의미

![Token alignment](/images/aaai2026/fig6-token-alignment.webp)

개념 관련 spectral component로 텍스트 임베딩 차이 벡터를 reconstruction하고, 그 결과를 CLIP 어휘 49,408개 토큰과 cosine similarity로 비교했다.

Nudity 개념의 spectral component로 reconstruction한 벡터에 가장 가까운 토큰들: "nude", "naked", "topless", "erotica", "nsfw" 등. 우리가 찾은 subspace가 진짜로 해당 의미를 인코딩하고 있다는 것을 텍스트 공간에서도 확인할 수 있었다.

---

## 응용: Spectral Nullification

이 분석에서 자연스럽게 나오는 응용이 **Spectral Nullification (SN)** — 개념에 해당하는 spectral component를 0으로 만들어서 개념을 제거하는 것이다.

$$\widetilde{\mathbf{W}}\_{\text{OV}}^{(h)} = \mathbf{W}\_{\text{OV}}^{(h)} - \sum_{i: (h,i) \in \mathcal{S}_c} \sigma_i^{(h)} \mathbf{u}_i^{(h)} (\mathbf{v}_i^{(h)})^T$$

![Quality-removal trade-off](/images/aaai2026/fig7-quality-tradeoff.webp)

기존 concept removal 방법들과 비교했을 때, **추가 학습 없이** 경쟁력 있는 성능을 보여준다. 특히 P4D, MMA, UnLearnDiffAtk 벤치마크에서 2등을 차지했다.

물론 SLD-Strong 같은 inference-time 가이딩 방법보다는 공격적인 adversarial prompt에 약한 편인데, 우리 방법의 의의는 **성능 자체보다 interpretability에 있다** — 왜 이 개념이 제거되는지를 SVD component 레벨에서 설명할 수 있다.

![I2P comparison](/images/aaai2026/fig8-i2p-comparison.webp)

---

## 돌아보며

이 연구를 하면서 가장 재미있었던 점은, **도구의 단순함** 이었다. SVD라는 클래식한 선형대수 도구 하나로 꽤 깊은 분석을 할 수 있었다. Mechanistic interpretability의 매력이 이런 데 있는 것 같다 — 복잡한 모델을 열어보면 의외로 깔끔한 구조가 숨어있다.

물론 한계도 있다. SVD는 **선형 분해**이기 때문에, 비선형적으로 인코딩된 개념은 잡아내기 어렵다. 그리고 OV circuit만 분석했기 때문에, self-attention이나 MLP 블록에서 일어나는 일은 다루지 못했다. 이 부분은 후속 연구에서 sparse transcoder 같은 도구로 확장하고 있다.

연구를 시작할 때는 "cross-attention에서 mechanistic interpretability가 통할까?"라는 의문이 있었는데, 결과적으로 **language model에서 발견된 패턴들 (polysemanticity, superposition, concept localization)이 diffusion model에서도 나타난다**는 것을 확인할 수 있었다. 이건 이 분야의 도구들이 modality를 넘어서 범용적으로 적용될 수 있다는 좋은 신호라고 생각한다.

---

질문이나 피드백이 있으면 [junhyun.bae.kr@gmail.com](mailto:junhyun.bae.kr@gmail.com)으로 보내주세요.
