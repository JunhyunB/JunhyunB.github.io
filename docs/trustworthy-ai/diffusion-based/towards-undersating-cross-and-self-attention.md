---
sidebar_position: 2
id: towards-undersating-cross-and-self-attention
title: "Towards Understanding Cross and Self-Attention in Stable Diffusion for Text-Guided Image Editing"
tags: [stable diffusion, ]
---

## Paper Information

- **Title**: Towards Understanding Cross and Self-Attention in Stable Diffusion for Text-Guided Image Editing
- **Authors**: Bingyan Liu, Chengyu Wang, Tingfeng Cao, Kui Jia, Jun Huang
- **Published**: CVPR 2024
- **Link**: [arXiv:2403.03431](https://arxiv.org/pdf/2403.03431)


## TL; DR
Prompt-to-Prompt(P2P)의 연구에서처럼, source에서 target image로 학습 없이 editing하려는 목적에서, cross-attention과 self-attention map의 replacement에 대한 효과를 구분해서 생각해야 할 필요가 있어보임.

## Abstract
Stable diffusion과 같은 Deep Text-to-Image Synthesis (TIS) 모델들은 주로 attention layers들을 학습하게 되는데, 이 attention layer들의 semantic meaning이나 어떤 attention maps의 부분들이 이미지 생성에 기여하는지 등이 거의 분석되지 않았다. 그래서 이 논문에서는 in-depth probing analysis를 통해서 cross-attention보다 self-attention maps가 기하학적/모양 디테일을 source image에서 target image로의 변환에 더 크게 기여함을 분석하였다.

## Key Findings
1. Diffusion model에서 cross-attnetion 맵을 수정하는것은 별로일 수도 있음.
2. 왜냐하면 cross-attention map은 텍스트 프롬프트의 가중치 측정일 뿐인 것 처럼 보이지만, 객체 속성 정보까지 포함하고 있어서 해당 attention map만 교체해서 이미지를 편집하려는 건 자연스럽지 못하게 바꿀수도 있음.
3. 그러면 self-attention map을 사용하면 어떻게 될지 궁금하지 않은가요?


![alt text](</static/figures/스크린샷 2025-05-06 오후 10.51.45.png>)

(위 그림처럼 cross-attention은 결국 text embedding이 얼마나 들어갈지를 결정해주는거긴 하지?)

## Method: Analysis on Cross and Self-Attention
그래서 분석을 어떻게 했느냐가 중요하다. Probing analysis는 별건 아니고 classifier로 분석하겠다~ 라는 의도이다. Classifier를 학습시킨 후 서로 다른 카테고리의 attention map을 분류할 수 있다면, 그 attention map은 해당 카테고리에 대한 의미있는 특징 정보를 갖고 있다고 볼 수 있다는 논리이다.

그럼 그 classifier를 어떻게 설계를 했을까? 2-layer MLP를 단순히 cross-attention/self-attention 위에 달았다. 끝. 
학습을 위한 프롬프트로는 
- a \<color\> \<object\> (색상)
- a/an \<animal\> standing in the park (동물)

이런 식으로 함.

## Probing Results
### What does the cross-attention map learn?
![alt text](</static/figures/스크린샷 2025-05-06 오후 11.04.47.png>)
Cross-attention에 달아준 classifier가 색상/동물 분류에 대해서 잘 맞추는걸 확인할 수 있다. 이는 cross-attention map이 각 클래스에 대한 특징도 포함하고 있음을 나타낸다고 할 수 있다. 

이를 활용하여 target prompt (a coral car, a rabbit standing in the park)에 대해서 source image 생성 시의 cross attention map으로 교체를 살짝 해주면 어떻게 될지를 봤다.

그 결과로, 아래의 Figure 4를 보면, cross-attention map replacement을 하면 target prompt가 rabbit임에도 불구하고 원본 객체인 dog의 특성이 강하게 남아있어 완전히 rabbit이 되지 못하는 것을 확인할 수 있다.


### What does the self-attention map learn?
![alt text](</static/figures/스크린샷 2025-05-06 오후 11.17.24.png>)
Self-attention에 달아준 classifier는 분류 성능이 엉망진창이다. 그나마 동물은 잘 맞추는 경향이 있는 것 같은데, 아마 동물마다 갖고있는 구조적인 정보가 좀 영향을 주는게 아닌가 싶다. Figure 4를 보면, target prompt로 좀 더 자연스럽게 변화하는걸 볼 수 있다.


![alt text](</static/figures/스크린샷 2025-05-06 오후 11.01.53.png>)


## Proposed Method: Free-Prompt-Editing (FPE)
위의 실험 및 발견들을 통해서 source 프롬프트 없이 이미지를 editing 하는 방법론을 제안함 (self-attention replacement는 프롬프트 필요없으니깐... 근데 source image를 만드려면 어차피 프롬프트 필요한거 아닌가? ㅎㅎ..)
P2P랑 다르게 source-target prompt mapping은 필요없긴하다. 그리고 real-image의 경우는 DDIM inversion으로 latent로 바꿔주면 됨.

위의 self-attention map 분류 실험의 결과를 근거로 4-14 layers에 대해서만 self-attention map을 교체해주는 방법론을 제안함.


## Results
P2P랑 비교한 걸 보면 좀 더 명확한듯하다. 실험의 의도가 여기서 나오는 것 같은데, 사실 어느 attention map을 교체할지, mix해서 교체할지는 목적에 따라 달라질 듯.

![alt text](</static/figures/스크린샷 2025-05-06 오후 11.27.17.png>)