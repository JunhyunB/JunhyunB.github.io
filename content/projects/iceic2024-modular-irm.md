---
title: "Invariant Risk Minimization in Medical Imaging with Modular Data Representation"
date: 2024-01-01
draft: false
tags: ["invariant-risk-minimization", "out-of-distribution", "medical-imaging"]
summary: "ICEIC 2024 — Jun-Hyun Bae, Chanwoo Kim, Taeyoung Chang"
ShowToc: false
ShowReadingTime: false
ShowShareButtons: false
hideMeta: true
cover:
  image: "/images/iceic2024/diagram.webp"
  alt: "Modular IRM diagram"
  hidden: true
---

<div style="text-align: center; margin-bottom: 1rem;">
<span class="venue-badge">ICEIC 2024</span><br>
<span style="color: var(--secondary);"><strong>Jun-Hyun Bae</strong><sup>1</sup>, Chanwoo Kim<sup>2</sup>, Taeyoung Chang<sup>2</sup><br>
<sup>1</sup>Kyungpook National University · <sup>2</sup>Seoul National University</span>
</div>

<div style="text-align: center; margin-bottom: 2rem;">
<a href="https://ieeexplore.ieee.org/document/10457174/" style="display: inline-block; padding: 0.4rem 1rem; border: 1px solid var(--primary); border-radius: 4px; margin: 0.2rem; text-decoration: none;">📄 Paper</a>
</div>

## Abstract

Despite the effectiveness of deep neural networks trained with Empirical Risk Minimization (ERM) in medical imaging tasks, these models often exhibit performance degradation when faced with Out-of-Distribution (OoD) data, owing to potential biases in their predictive accuracy. Invariant Risk Minimization (IRM) seeks to rectify this issue by identifying invariant or causal correlations across various environments. However, its practical application does not consistently deliver the expected generalization performance in real-world scenarios. This paper addresses a potential limitation of the IRM framework, positing that the constraints enforced by IRM might not sufficiently guide the model in learning all causal features. In response, we propose a novel methodology leveraging modular neural networks within the IRM framework. Our approach aims to generate more diverse data representations, thereby enhancing the generalization performance of models trained with IRM. Experimental validation on three tasks — two medical image classification tasks, namely, Camelyon17-wilds and CheXpert, and a synthetic task, Colored MNIST — demonstrates significant improvements in generalization performance in both OoD settings and subpopulation shift cases.

---

## Overview

IRM이 지배적인 invariant feature만 학습하는 한계를 modular neural network로 극복하여, 의료 영상에서의 OoD 일반화를 개선한다.

1. **Modular encoder** — 데이터 표현 모델을 $N$개 모듈로 분할하여 각각이 서로 다른 invariant feature를 학습하도록 유도한다.
2. **Competitive selection** — Multi-head dot product attention으로 입력에 가장 관련 있는 $k$개 모듈을 선택한다.
3. **IRM optimization** — 선택된 모듈의 가중 표현으로 IRM 목표를 최적화하여 다양한 invariant feature를 활용한 OoD 일반화를 달성한다.

![Modular IRM Framework](/images/iceic2024/diagram.webp)

<p class="caption">제안 방법의 구조도. Modular data representation을 IRM 프레임워크 내에 통합한다.</p>

---

## Method

IRM은 여러 environment에 걸쳐 invariant한 predictor를 찾는 것을 목표로 하지만, 실제로는 **가장 지배적인(dominant) invariant feature만 인코딩**하는 한계가 있다. 이 문제는 Camelyon17이나 CheXpert 같은 실제 의료 영상 데이터에서 더욱 두드러지며, IRM이 ERM보다 오히려 나쁜 결과를 보이는 원인이 된다.

이를 해결하기 위해 데이터 표현 모델 $\Phi$를 $N$개의 독립적인 모듈 $\{f_n\}_{n=1}^N$으로 분할한다. 각 모듈은 multi-head dot product attention을 통한 **competitive learning**으로 서로 다른 feature를 학습하도록 유도된다. 입력 자체가 query, 모듈 출력이 key/value로 작동하며, top-$k$ 모듈이 선택된다. Module collapse를 방지하기 위해, 비선택 모듈의 attention score는 negative infinity가 아닌 zero로 설정하여 soft selection을 유지한다.

![Dataset Examples](/images/iceic2024/data.webp)

<p class="caption">Camelyon17-wilds와 CheXpert 데이터셋의 환경별 예시 이미지.</p>

---

## Results

### Colored MNIST

| Algorithm | Val Accuracy (iid) | Test Accuracy (OoD) | # Params |
|---|---|---|---|
| ERM | 88.6% | 16.4% | 1,198,337 |
| IRM | 73.4% | 60.5% | 1,198,337 |
| **Ours (N=3, k=1)** | **74.9%** | **66.5%** | 935,553 |
| Optimal | 75.0% | 75.0% | N/A |

제안 방법(N=3, k=1)은 IRM 대비 OoD 정확도를 6.0%p 향상시키면서(66.5% vs 60.5%), 파라미터 수는 오히려 22% 적다. Validation 정확도가 74.9%로 이론적 최적값(75.0%)에 근접한다는 것은, 모델이 spurious feature(color)를 거의 사용하지 않고 invariant feature(digit shape)를 학습하고 있음을 의미한다.

### Camelyon17-wilds (OoD Medical Imaging)

| Algorithm | Val Accuracy (iid) | Test Accuracy (OoD) | # Params |
|---|---|---|---|
| ERM | 91.9% | 73.3% | 42.8M |
| IRM | 94.1% | 72.9% | 42.8M |
| **Ours (N=4, k=2)** | 91.5% | **83.5%** | 45.6M |
| Ours (N=2, k=1) | 90.4% | 74.5% | **22.8M** |

이 결과에서 주목할 점은 **IRM(72.9%)이 ERM(73.3%)보다 오히려 낮은 OoD 정확도**를 보인다는 것이다. 이는 IRM이 지배적인 invariant feature에만 의존하면서, 실제로 필요한 다양한 causal feature를 놓치고 있음을 보여주는 것으로, 본 논문의 핵심 동기를 실증적으로 뒷받침한다. 제안 방법(N=4, k=2)은 ERM 대비 +10.2%p의 OoD 향상(83.5% vs 73.3%)을 달성한다. 한편 N=2, k=1 구성은 파라미터를 크게 줄이면서도(22.8M vs 42.8M) baseline과 비슷한 성능(74.5%)을 유지한다.

### CheXpert (Subpopulation Shift)

| Algorithm | Average Accuracy | Worst-case Accuracy |
|---|---|---|
| ERM | 86.9% | 50.2% |
| IRM | 89.8% | 34.4% |
| **Ours (N=3, k=1)** | 80.3% | **59.6%** |

CheXpert에서도 IRM은 ERM보다 **worst-case 정확도가 15.8%p 더 낮다**(34.4% vs 50.2%). IRM이 평균 정확도는 높이지만 특정 demographic 그룹의 성능을 심각하게 저하시키는 것이다. 제안 방법은 average accuracy가 다소 감소하나, worst-case accuracy를 59.6%로 끌어올려 ERM 대비 +9.4%p, IRM 대비 +25.2%p의 향상을 달성한다. 이는 의료 영상에서 demographic 그룹 간 공정한 성능이 중요한 상황에서 의미가 크다.

### Module & Winner 수에 따른 Ablation (Camelyon17)

<p class="caption">Module 수(N)와 winner 수(k) 조합에 따른 OoD test accuracy (%).</p>

| N (Modules) | k (Winners) | Test Accuracy (OoD) |
|:---:|:---:|:---:|
| 2 | 1 | 74.5 |
| 3 | 1 | 73.1 |
| 3 | 2 | 57.6 |
| 4 | 1 | 73.4 |
| **4** | **2** | **83.5** |
| 5 | 1 | 74.6 |
| 5 | 2 | 75.6 |

k=1인 경우 module 수에 관계없이 73–75% 수준에서 안정적이며, baseline 대비 큰 향상을 보이지 않는다. N=4, k=2 구성이 83.5%로 가장 높은 정확도를 기록하며, 이는 표에서 확인할 수 있는 최고 성능이다. 반면 N=3, k=2는 57.6%로 가장 낮은 결과를 보이고, N=5, k=2는 75.6%에 머문다.

---
