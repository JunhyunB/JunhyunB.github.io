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

IRM이 가장 지배적인 invariant feature만 학습할 수 있다는 한계를 modular neural network로 보완하여, 의료 영상의 OoD 및 subpopulation shift 상황에서 일반화 성능을 높인다.

1. **Modular encoder** — 데이터 표현 모델을 $N$개 모듈로 분할하여 각각이 서로 다른 invariant feature를 학습하도록 유도한다.
2. **Competitive selection** — Multi-head dot product attention으로 입력에 가장 관련 있는 $k$개 모듈을 선택한다.
3. **IRM optimization** — 경쟁으로 조정된 attention score로 모듈 출력을 가중합해 최종 표현 $\Phi(x)$를 만들고, 이를 IRM 목표로 학습한다.

![Modular IRM Framework](/images/iceic2024/diagram.webp)

<p class="caption">제안 방법의 구조도. Modular data representation을 IRM 프레임워크 내에 통합한다.</p>

---

## Method

IRM은 여러 environment에 걸쳐 invariant한 predictor를 찾는 것을 목표로 하지만, data representation 모델 자체에는 아무 제약을 두지 않고 ERM 항에 기대어 표현을 학습한다. 그 결과 **가장 지배적인(dominant) invariant feature만 인코딩**하는 데 그칠 수 있다. 실제로 Camelyon17-wilds나 CheXpert 같은 의료 영상 데이터에서는 IRM이 ERM보다 오히려 낮은 성능을 보이기도 한다.

이를 해결하기 위해 데이터 표현 모델 $\Phi$를 $N$개의 독립적인 모듈 $\{f_n\}_{n=1}^N$으로 분할한다. 각 모듈은 multi-head dot product attention을 통한 **competitive learning**으로 서로 다른 feature를 학습하도록 유도된다. 입력 자체가 query, 모듈 출력이 key/value로 작동하며, top-$k$ 모듈이 선택된다. Module collapse(소수 모듈만 계속 선택되는 현상)를 완화하기 위해, 비선택 모듈의 $QK^T$ 값을 negative infinity가 아닌 0으로 설정한다. 이렇게 하면 softmax 이후에도 비선택 모듈이 0이 아닌 가중치를 받아 soft selection이 유지된다.

![Dataset Examples](/images/iceic2024/data.webp)

<p class="caption">Camelyon17-wilds와 CheXpert 데이터셋의 환경별 예시 이미지.</p>

---

## Results

### Colored MNIST

두 training environment에서 숫자의 색은 레이블과 각각 90%, 80% 일치하지만, 숫자 모양은 75%만 일치한다. Test environment에서는 색과 레이블의 관계가 뒤집혀(10%) 색에 의존하는 모델은 크게 실패하고, 모양만 쓰는 이상적인 모델은 학습과 테스트 모두에서 75%를 유지한다(표의 Optimal).

| Algorithm | Val Accuracy (iid) | Test Accuracy (OoD) | # Params |
|---|---|---|---|
| ERM | 88.6% | 16.4% | 1,198,337 |
| IRM | 73.4% | 60.5% | 1,198,337 |
| **Ours (N=3, k=1)** | **74.9%** | **66.5%** | 935,553 |
| Optimal | 75.0% | 75.0% | N/A |

제안 방법(N=3, k=1)은 IRM 대비 OoD 정확도를 6.0%p 향상시키면서(66.5% vs 60.5%), 파라미터 수는 오히려 22% 적다. Validation 정확도(74.9%)는 digit shape만 사용하는 이상적 모델(75.0%)에 근접하고, OoD 정확도도 세 방법 중 가장 높아 spurious feature(color)에 가장 덜 의존함을 보여준다. 다만 이상적 모델의 OoD 정확도(75.0%)에는 아직 못 미친다.

### Camelyon17-wilds (OoD Medical Imaging)

Camelyon17-wilds는 림프절 조직 패치에서 종양 유무를 판별하는 과제다. 병원 1–3의 데이터로 학습하고 병원 4로 검증하며, 학습에 쓰지 않은 병원 5의 데이터로 테스트한다. ERM과 IRM은 ResNet-101을, 제안 방법은 ResNet-18 모듈을 사용한다.

| Algorithm | Val Accuracy (iid) | Test Accuracy (OoD) | # Params |
|---|---|---|---|
| ERM | 91.9% | 73.3% | 42.8M |
| IRM | 94.1% | 72.9% | 42.8M |
| **Ours (N=4, k=2)** | 91.5% | **83.5%** | 45.6M |
| Ours (N=2, k=1) | 90.4% | 74.5% | **22.8M** |

이 결과에서 주목할 점은 **IRM(72.9%)이 ERM(73.3%)보다 오히려 낮은 OoD 정확도**를 보인다는 것이다. IRM의 제약만으로는 다양한 invariant feature 학습이 보장되지 않을 수 있다는 본 논문의 문제의식과 맞닿는 결과다. 제안 방법(N=4, k=2)은 ERM 대비 +10.2%p의 OoD 향상(83.5% vs 73.3%)을 달성한다. 한편 N=2, k=1 구성은 약 절반의 파라미터(22.8M vs 42.8M)로도 ERM·IRM보다 약간 높은 성능(74.5%)을 보인다.

### CheXpert (Subpopulation Shift)

CheXpert는 흉부 X선 영상이 'No Finding'인지 분류하는 과제로, 인종(White, Black, Other)과 성별의 조합으로 environment를 나눈다. 목표는 OoD 일반화가 아니라 모든 environment 가운데 가장 낮은 정확도(worst-case accuracy)를 높이는 것이다. ERM과 IRM은 ResNet-50을, 제안 방법은 ResNet-18 모듈을 사용한다.

| Algorithm | Average Accuracy | Worst-case Accuracy |
|---|---|---|
| ERM | 86.9% | 50.2% |
| IRM | 89.8% | 34.4% |
| **Ours (N=3, k=1)** | 80.3% | **59.6%** |

CheXpert에서도 IRM은 ERM보다 **worst-case 정확도가 15.8%p 더 낮다**(34.4% vs 50.2%). IRM은 평균 정확도는 더 높지만 가장 취약한 demographic 그룹에서는 성능이 크게 떨어진다. 제안 방법은 평균 정확도(80.3%)가 ERM(86.9%)·IRM(89.8%)보다 낮은 대신, worst-case accuracy를 59.6%로 끌어올려 ERM 대비 +9.4%p, IRM 대비 +25.2%p 향상된다. 이는 의료 영상에서 demographic 그룹 간 공정한 성능이 중요한 상황에서 의미가 크다.

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

k=1인 경우 module 수에 관계없이 73–75% 수준에서 안정적이며, baseline 대비 큰 향상을 보이지 않는다. N=4, k=2 구성이 83.5%로 가장 높다. 반면 k=2에서는 N에 따른 편차가 커서, N=3은 57.6%로 가장 낮고 N=5는 75.6%에 그친다.

---
