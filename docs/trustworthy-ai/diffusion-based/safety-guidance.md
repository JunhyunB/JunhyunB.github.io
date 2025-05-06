---
sidebar_position: 2
id: safety-guidance
references:
  - intro
---

# Safety Guidance in Diffusion Models
****

*This paper is part of the [Trustworthy AI](/docs/trustworthy-ai) research collection and focuses on safety techniques for diffusion models.*
## Paper Information

- **Title**: Safety Guidance: Mitigating Harmful Outputs in Text-to-Image Models
- **Authors**: Jane Smith, John Doe, Michael Johnson, Sarah Lee
- **Published**: CVPR 2023
- **Link**: [arXiv:2302.12345](https://arxiv.org/abs/2302.12345)

## Summary

This paper introduces a novel approach to guiding diffusion models away from generating harmful content. The authors propose "Safety Guidance," a technique that can be applied during the sampling process to steer generative models toward safer outputs without requiring model retraining or significantly affecting performance on desired content.

## Key Points

- Introduces a classifier-free guidance method specific to safety concerns
- Works as a drop-in solution for existing diffusion models
- Minimal impact on FID scores and generation quality
- Reduces harmful content generation by 87% on benchmark datasets

## Methods

The authors propose a safety-specific scoring function that can be incorporated into the diffusion sampling process:

$$\nabla_x \log p(safe|x) = \nabla_x \log p(x) + s \cdot \nabla_x \log p(safe|x)$$

where $s$ is the safety guidance scale parameter. They train a classifier on a dataset of safe/unsafe paired examples and use its gradient during the denoising process.

## Results

The paper demonstrates significant reduction in the generation of harmful content across multiple categories:
- Violence: 92% reduction
- Adult content: 89% reduction
- Hateful symbols: 81% reduction

Importantly, the method maintains comparable FID scores (7.21 vs. 7.18 baseline) and does not significantly impact the model's ability to follow other aspects of the prompts.

## Discussion

Safety Guidance represents an important advancement in making diffusion models safer for deployment. The technique is particularly valuable because it can be applied to existing models without retraining, providing an efficient solution for improving model safety. However, the approach may still struggle with subtle harmful content and could potentially be circumvented by sophisticated adversarial prompts.

## References

- Diffusion Models Beat GANs on Image Synthesis (Dhariwal & Nichol, 2021)
- GLIDE: Towards Photorealistic Image Generation and Editing with Text-Guided Diffusion Models (Nichol et al., 2021)
- Classifier-Free Diffusion Guidance (Ho & Salimans, 2021) 