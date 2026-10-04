---
title: "Adaptive Bias Discovery for Learning Debiased Classifier"
date: 2024-12-01
draft: false
tags: ["debiasing", "spurious-correlations", "out-of-distribution"]
summary: "ACCV 2024 — Jun-Hyun Bae, Minho Lee, Heechul Jung"
ShowToc: false
ShowReadingTime: false
ShowShareButtons: false
hideMeta: true
cover:
  image: "/images/accv2024/method.webp"
  alt: "ABD Framework"
  hidden: true
---

<div style="text-align: center; margin-bottom: 1rem;">
<span class="venue-badge">ACCV 2024</span><br>
<span style="color: var(--secondary);"><strong>Jun-Hyun Bae</strong>, Minho Lee, Heechul Jung<br>
Kyungpook National University</span>
</div>

<div style="text-align: center; margin-bottom: 2rem;">
<a href="https://openaccess.thecvf.com/content/ACCV2024/html/Bae_Adaptive_Bias_Discovery_for_Learning_Debiased_Classifier_ACCV_2024_paper.html" style="display: inline-block; padding: 0.4rem 1rem; border: 1px solid var(--primary); border-radius: 4px; margin: 0.2rem; text-decoration: none;">📄 Paper</a>
</div>

## Abstract

Training deep neural networks with empirical risk minimization (ERM) often captures dataset biases, hindering generalization to new or unseen data. Previous solutions either require prior knowledge of biases or utilize training intentionally biased models as auxiliaries; however, they still suffer from multiple biases. To address this, we introduce Adaptive Bias Discovery (ABD), a novel learning framework designed to mitigate the impact of multiple unknown biases. ABD trains an auxiliary model to be adapted to biases based on the debiased parameters from the debiasing phase, allowing it to navigate through multiple biases. Then, samples are reweighted based on the discovered biases to update debiased parameters. Extensive evaluations of synthetic experiments and real-world datasets demonstrate that ABD consistently outperforms existing methods, particularly in real-world applications where multiple unknown biases are prevalent.

---

## Overview

사전 바이어스 정보 없이 데이터에 존재하는 여러 바이어스를 순차적으로 발견하고 제거하는 학습 프레임워크를 제안한다.

1. **Bias-adapted model** — Debiased 파라미터 $\theta$에서 gradient descent를 한 번(또는 몇 번) 수행해 바이어스에 민감한 보조 모델 $f_\phi$를 얻는다.
2. **Adaptive group formation** — $f_\phi$의 예측으로 데이터를 바이어스 정렬 그룹($G^\odot$)과 상충 그룹($G^\otimes$)으로 분할한다.
3. **Iterative debiasing** — Group DRO로 worst-case 그룹 손실을 최소화하며, $\theta$가 한 바이어스에 강건해지면 $\phi$가 자연스럽게 다음 바이어스를 발견한다.

![ABD Framework](/images/accv2024/method.webp)

<p class="caption">
ABD 프레임워크 개요. 두 가지 바이어스(Bias1, Bias2)와 두 학습 스텝을 예로 들었다. Bias1은 Bias2보다 신경망이 더 쉽게 학습하는 단순한 특징이며, 보조 모델을 debiased 파라미터에서 출발시켜 아직 발견되지 않은 바이어스에 집중하게 한다.
</p>

---

## Method

ERM으로 학습된 모델은 데이터에 존재하는 spurious correlation을 쉽게 포착하여 일반화 성능이 저하된다. 기존 방법들은 바이어스 정보를 사전에 알고 있어야 하거나(Group DRO), 따로 학습한 biased model이 가장 두드러진 바이어스 위주로 포착해 여러 바이어스가 공존하면 효과가 떨어진다는(PI, JTT) 한계가 있다.

ABD는 바이어스 발견과 제거, 두 단계를 번갈아 반복한다. 먼저 debiased 파라미터 $\theta$에서 gradient descent로 bias-adapted 파라미터 $\phi = \theta - \alpha \nabla_\theta \mathcal{L}(f_\theta)$를 얻는다(식은 한 스텝이지만 여러 스텝도 가능하며, Colored MNIST 실험에서는 세 스텝을 사용했다). 신경망은 학습하기 쉬운 표면적 특징부터 익히는 경향이 있으므로, 이렇게 얻은 $f_\phi$는 데이터의 표면적 패턴, 즉 바이어스에 민감하게 반응한다. 이를 이용해 $f_\phi$가 맞힌 샘플을 바이어스 정렬 그룹($G^\odot$), 틀린 샘플을 바이어스 상충 그룹($G^\otimes$)으로 나눈다.

다음으로 두 그룹의 손실을 $f_\phi$로 계산해 가중합한 목적함수를 최소화하도록 $\theta$를 업데이트한다.

$$J(\theta) = a\,\mathcal{L}_{G^\odot}(f_\phi) + b\,\mathcal{L}_{G^\otimes}(f_\phi), \qquad \theta \leftarrow \theta - \beta \nabla_\theta J(\theta)$$

그룹 가중치 $a$와 $b = 1 - a$는 두 그룹 손실에 temperature $\tau$를 적용한 softmax로 정한다(online group DRO). 손실이 큰 그룹일수록 가중치가 커지며, $\tau$가 크면 ERM의 평균 손실에, $\tau \ll 1$이면 worst-case 그룹(바이어스와 상충하는 샘플)만 고르는 것에 가까워진다. $\theta$에 대한 gradient는 $\phi$를 거쳐 계산하며, MAML처럼 1차 근사를 쓴다.

핵심은 $\phi$가 매 스텝마다 갱신된 $\theta$에서 다시 만들어진다는 점이다. $\theta$가 첫 번째 바이어스에 대해 강건해지면, 그 $\theta$에서 출발한 $\phi$는 아직 해결되지 않은 다음 바이어스를 포착하게 된다. 바이어스 발견($\phi$)과 제거($\theta$)를 하나의 학습 루프로 엮은 이 MAML 유사 구조 덕분에, 사전 바이어스 정보 없이도 여러 바이어스를 순차적으로 발견하고 제거할 수 있다.

아래 GradCAM 시각화에서 biased model $f_\phi$의 attention은 학습이 진행됨에 따라 다른 영역으로 옮겨 간다. ABD가 학습 중에 여러 바이어스를 적응적으로 찾아간다는 것을 시각적으로 보여주는 예이다.

![Biased Model Evolution](/images/accv2024/inner_vis2_compressed.webp)

<p class="caption">
MetaShift 테스트 이미지에 대한 ERM 모델과 ABD의 biased model $f_\phi$의 GradCAM 시각화. 학습 epoch이 진행되면서 $f_\phi$가 주목하는 영역이 계속 바뀐다.
</p>

### 이론적 분석

Group DRO는 바이어스 정보로 미리 정한 그룹 집합 $\mathcal{G}$에서 worst-case 그룹 손실을 최소화한다. 반면 ABD는 학습 중 매 스텝 바이어스의 일부만 발견하므로, 그룹이 확률적으로 선택되는 과정($\mathcal{G}' \sim \mathcal{B}$)으로 볼 수 있다. Group DRO의 worst-case risk와 ABD의 기대 worst-case risk 사이의 차이 $\text{Gap}(\theta)$는 다음과 같이 bound된다(Theorem 1).

$$\text{Gap}(\theta) \le \frac{2^{m-1}-1}{2^{m}-1}\,\Delta(\theta), \qquad \Delta(\theta) = \max_{g \in \mathcal{G}} \mathcal{L}_g(f_\theta) - \min_{g \in \mathcal{G}} \mathcal{L}_g(f_\theta)$$

여기서 $m$은 그룹 수, $\Delta(\theta)$는 그룹 간 손실의 최대 차이다. 즉 ABD가 바이어스를 잘 찾아낸다면, 사전 바이어스 지식에 의존하는 group DRO에 근접한 성능을 낼 수 있다.

---

## Results

### Colored MNIST — 복수 바이어스 처리

기존 방법과의 차이를 가장 잘 보여주는 실험이다. 바이어스가 Color 하나일 때와 Color + Patch 둘 다 존재할 때를 비교한다.

<p class="caption">
OoD test accuracy (%). 바이어스가 하나일 때와 둘 다 존재할 때의 비교.
</p>

| Algorithm | Color (OoD) | Color & Patch (OoD) |
|:---|:---:|:---:|
| ERM | 16.4 | 14.0 |
| IRM | 66.9 | 13.4 |
| Group DRO | 13.6 | 14.1 |
| PI | 70.2 | 15.3 |
| **ABD (Ours)** | **70.7** | **62.3** |
| *Optimal* | *75.0* | *75.0* |

PI는 Color 바이어스만 발견하고 Patch는 포착하지 못하여, 바이어스가 두 개가 되면 15.3%로 사실상 실패한다 (54.9%p 하락). IRM과 Group DRO 역시 복수 바이어스 환경에서 ERM 수준에 머문다. ABD는 Color → Patch 순으로 바이어스를 발견하여, 복수 바이어스 환경에서 유의미한 OoD 성능(62.3%)을 달성하는 유일한 방법이다.

<div class="figure-row">
<figure>
<img src="/images/accv2024/regroup_PI2.png" alt="PI Baseline" class="fig-pi">
<figcaption class="caption">(a) PI — Color만 발견, Patch 포착 실패.</figcaption>
</figure>
<figure>
<img src="/images/accv2024/regroups_ours.png" alt="Bias Discovery - ABD" class="fig-abd">
<figcaption class="caption">(b) ABD — 학습이 진행되면서 Color → Patch 순으로 발견.</figcaption>
</figure>
</div>

<p class="caption">Colored MNIST에서 각 그룹($G^\odot$, $G^\otimes$) 내 레이블과 바이어스 특징(Color, Patch) 간의 Pearson 상관계수.</p>

### Real-World Tasks

**바이어스 annotation이 있는 데이터셋 — CivilComments & MultiNLI**

<p class="caption">
Worst-case test accuracy (%). CivilComments의 <em>Group</em> 열은 각 알고리즘이 그룹화에 사용한 demographic 정보를 나타낸다. MultiNLI의 Group DRO*는 사전 바이어스 지식으로 직접 정의한 그룹을 사용하는 oracle 설정이다.
</p>

| Algorithm | CivilComments | Group (CC) | MultiNLI |
|:---|:---:|:---:|:---:|
| ERM | 56.0 | *None* | 61.8 |
| IRM | 66.3 | *(label × Black)* | — |
| Group DRO | 69.1 | *(label)* | 62.7 |
| Group DRO | 70.0 | *(label × Black)* | — |
| JTT | 69.3 | *None* | 63.2 |
| PI | 61.1 | *None* | 61.5 |
| **ABD (Ours)** | **71.1** | *None* | **67.1** |
| *Group DRO\* (oracle)* | — | — | *67.5* |

**바이어스 annotation이 없는 데이터셋 — Camelyon17 & FMoW (WILDS)**

<p class="caption">
Camelyon17-wilds는 OoD average accuracy, FMoW-wilds는 worst-region accuracy (%).
</p>

| Algorithm | Camelyon17 | FMoW |
|:---|:---:|:---:|
| ERM | 70.3 ± 6.4 | 32.3 ± 1.3 |
| IRM | 59.5 ± 7.7 | 31.7 ± 1.2 |
| Group DRO | 68.4 ± 7.3 | 30.8 ± 0.8 |
| CORAL | 59.5 ± 7.7 | 32.8 ± 0.7 |
| JTT | 63.8 ± 1.4 | 33.4 ± 0.9 |
| PI | 71.7 ± 7.5 | 31.2 ± 0.3 |
| CGD | 69.4 ± 7.9 | 32.0 ± 2.3 |
| LISA | 77.1 ± 6.5 | **35.5 ± 0.7** |
| **ABD (Ours)** | **81.1 ± 4.8** | 34.1 ± 2.5 |

CivilComments에서 ABD(71.1%)는 **바이어스 annotation을 사용하는 Group DRO(label × Black, 70.0%)를 annotation 없이 능가**한다. MultiNLI에서는 ABD(67.1%)가 사전 바이어스 정보 없이도 수작업 그룹을 쓰는 oracle **Group DRO\*(67.5%)와 0.4%p 차이까지 근접**한다. Camelyon17에서는 LISA 대비 +4.0%p 향상(81.1% vs 77.1%)을 보이며, FMoW에서도 LISA에 근접한 경쟁력 있는 성능을 유지한다. IRM·CORAL(invariance·분포 정렬 기반)과 Group DRO·CGD(group robustness 기반)는 WILDS 벤치마크에서 ERM 수준에 머물거나 오히려 하락한다.

![MultiNLI Analysis](/images/accv2024/mnli_analysis3.webp)

<p class="caption">
MultiNLI에서 오분류 그룹 $G^\otimes$의 바이어스 구성 변화. Negation 바이어스 발견 후 Overlap 바이어스가 점차 드러난다.
</p>

### MetaShift — Distributional Distance에 따른 성능 변화

MetaShift에서는 training과 test 간 distributional distance를 조절하여 각 방법의 강건성을 평가한다. ABD는 distance 0.71 이상의 모든 구간에서 가장 높은 정확도를 보이며, 격차는 가장 먼 1.43에서 가장 크다.

<p class="caption">
MetaShift test accuracy (%). Distance가 클수록 분포 차이가 크다.
</p>

| Distance | 0.44 | 0.71 | 1.12 | 1.43 |
|:---|:---:|:---:|:---:|:---:|
| ERM | 80.1 | 68.4 | 52.1 | 33.2 |
| IRM | 79.5 | 67.4 | 51.8 | 32.0 |
| Group DRO | 77.0 | 68.9 | 51.9 | 34.2 |
| LISA | **81.3** | 69.7 | 54.2 | 37.5 |
| **ABD (Ours)** | 80.4 | **71.8** | **55.2** | **41.8** |

Distance가 가장 작은 0.44에서는 LISA(81.3%)가 근소하게 앞서지만, 0.71 이상에서는 모든 구간에서 ABD가 1위이며 가장 먼 1.43에서는 ABD(41.8%)가 LISA(37.5%)를 4.3%p 앞선다. 분포 차이가 큰 실제 OoD 환경에서 ABD가 특히 유리할 수 있음을 시사한다.

<img src="/images/accv2024/gradcam_compressed.webp" alt="GradCAM" style="max-width: 55%;">

<p class="caption">
MetaShift 테스트 데이터의 GradCAM 시각화. ERM은 배경에 의존하지만, ABD는 대상 객체에 집중한다.
</p>

---
