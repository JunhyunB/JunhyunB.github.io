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

A 2-3 paragraph summary of the paper's main contributions and significance.


## Abstract
Stable diffusion과 같은 Deep Text-to-Image Synthesis (TIS) 모델들은 주로 attention layers들을 학습하게 되는데, 이 attention layer들의 semantic meaning이나 어떤 attention maps의 부분들이 이미지 생성에 기여하는지 등이 거의 분석되지 않았다. 그래서 이 논문에서는 in-depth probing analysis를 통해서 cross attention보다 self-attention maps가 기하학적/모양 디테일을 source image에서 target image로의 변환에 더 크게 기여함을 분석하였다.

## Key Findings