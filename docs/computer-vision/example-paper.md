---
sidebar_position: 2
tags: [computer-vision, deep-learning, neural-networks, image-recognition]
sources:
  - neural-networks
  - deep-learning
references:
  - skip-connections
  - ImageNet
  - VGG
  - GoogLeNet
  - AlexNet
---

# ResNet: Deep Residual Learning for Image Recognition

**Authors**: Kaiming He, Xiangyu Zhang, Shaoqing Ren, Jian Sun  
**Published**: 2016, CVPR  
**Link**: [arXiv](https://arxiv.org/abs/1512.03385)

## Summary

This paper introduced the Residual Network (ResNet) architecture which addresses the degradation problem in deep neural networks by introducing skip connections that enable training of much deeper networks. ResNet is related to research in deep learning and neural networks.

## Key Contributions

- Introduced the concept of residual learning with skip connections
- Demonstrated training of extremely deep networks (up to 152 layers)
- Significantly reduced error rates on ImageNet and won the ILSVRC 2015 competition
- Showed that increasing depth can improve accuracy when using residual connections

## Method

The core innovation in ResNet is the residual block, which can be expressed as:

```
y = F(x, W) + x
```

Where:
- x is the input
- F(x, W) is the residual mapping to be learned
- y is the output

Instead of hoping each stack of layers directly fits a desired underlying mapping, the authors explicitly let these layers fit a residual mapping. The hypothesis is that it's easier to optimize the residual mapping than to optimize the original, unreferenced mapping.

This approach is related to skip connections and gradient flow concepts in neural networks.

![ResNet Architecture](https://miro.medium.com/v2/resize:fit:1400/1*6YYIkuxo4IZ0qT9p1YcnTQ.png)

## Results

- ResNet-152 achieved a top-5 error rate of 4.49% on the ImageNet test set
- ResNet-101 performed better than previous state-of-the-art models with fewer FLOPs
- Error rates decreased with increased depth, contrary to plain networks
- Ensemble of ResNets achieved 3.57% top-5 error on ImageNet test set

The technique has been extended in later work such as ResNeXt and DenseNet.

## My Notes

ResNet was a groundbreaking paper that fundamentally changed how we design deep neural networks. The concept of skip connections has been incorporated into nearly all modern network architectures.

Key insights:
- Residual connections allow gradients to flow more easily through the network
- Training very deep networks becomes feasible
- The concept can be applied to many different types of layers and network architectures

The paper also highlights an important principle in deep learning: sometimes the most powerful innovations come from simple but elegant ideas. The residual connection is essentially just an identity mapping with addition, yet it unlocked the potential of much deeper networks.

Related work in computer vision includes VGG, GoogLeNet, and AlexNet.