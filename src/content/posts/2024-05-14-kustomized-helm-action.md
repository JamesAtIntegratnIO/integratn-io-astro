---
title: "Streamline Kubernetes Deployments with Kustomized Helm Action and ArgoCD Integration"
pubDate: 2024-05-14T15:58:47-06:00
tags: [git, argocd, developer, workflow, Kubernetes, Helm, Kustomize]
categories: [workflow, devops]
heroImage: /shipping-abstract.webp
description: "Discover how to simplify Kubernetes deployments using Kustomized Helm Action and ArgoCD. Learn key features, benefits, and integration steps for efficient CI/CD pipelines."
---

Managing Kubernetes applications can be a complex endeavor, especially when dealing with multiple environments and configurations. To streamline this process, we've developed the Kustomized Helm Action—a powerful GitHub Action that simplifies the generation and management of Kubernetes manifests using Helm charts and Kustomize overlays.<!--more--> In this blog post, we'll explore how this action works, its key features, and how you can integrate it into your CI/CD pipeline for efficient Kubernetes deployments using ArgoCD.

## Why Use Kustomized Helm Action for Kubernetes Deployments?

Kubernetes manifests are essential for defining the desired state of your cluster's resources. However, managing these manifests can become cumbersome as your application grows and evolves. Helm and Kustomize are two popular tools that help with this, but integrating them into your workflow often requires manual steps and additional scripting.

The Kustomized Helm Action addresses this challenge by automating the generation of Kubernetes manifests from Helm charts and Kustomize overlays. This action not only simplifies the process but also ensures consistency across different environments.

## Understanding the Rendered Manifests Pattern in Kubernetes

The Rendered Manifests pattern is an approach to Kubernetes deployment management where the desired state of the application is captured in pre-rendered manifest files. Instead of dynamically generating these manifests at deployment time, they are rendered and committed to the version control system as part of the CI/CD pipeline. This pattern offers several advantages:

1. **Version Control and Auditing**: Since the manifests are committed to a Git repository, every change is version-controlled and auditable. This ensures that the exact state of the cluster at any point in time can be traced and reviewed.

2. **Reproducibility**: By rendering the manifests in advance, you ensure that the same configuration is applied consistently across different environments. This reduces the risk of discrepancies between development, staging, and production environments.

3. **Separation of Concerns**: The process of rendering manifests is decoupled from the deployment process. This allows teams to focus on defining the desired state of the application without worrying about the specifics of the deployment tooling.

## Implementing the Rendered Manifests Pattern with Kustomized Helm Action

The Kustomized Helm Action generates manifests based on the Helm charts and Kustomize overlays in your source folder and commits these pre-rendered manifests to a specified branch. This ensures that the rendered state of your application is always version-controlled and easily accessible for deployment tools like ArgoCD.

## Key Features of Kustomized Helm Action

### Dynamic Helm Repository Management

One of the standout features of the Kustomized Helm Action is its ability to dynamically add Helm repositories based on the charts and overlays found in the specified source folder. This means you don't need to pre-configure repositories manually—everything is handled automatically.

### Customizable Manifests

The action supports both Helm charts and Kustomize overlays, allowing for highly customizable Kubernetes configurations. You can define a base Helm chart and apply different overlays for various environments, such as development, staging, and production.

### Automated Deployment

Integrating this action into your CI/CD pipeline ensures that your Kubernetes manifests are always up-to-date. Every time you push changes to your repository, the action will generate the necessary manifests and commit them to a specified branch, ready for deployment.

## How Kustomized Helm Action Works

The Kustomized Helm Action expects a specific directory structure in your source folder. Here's an example:

```plaintext
source_folder
  myapp
    base
      Chart.yaml
      kustomization.yaml
      values.yaml
    overlays
      cluster1
        kustomization.yaml
        my-patch.yaml
        values.yaml
      cluster2
        kustomization.yaml
        values.yaml
```

In this structure, `myapp` is a Helm chart with a base configuration and two overlays, `cluster1` and `cluster2`. Each overlay can have its own `values.yaml` file and additional Kustomize patches.

### Example Workflow for Kustomized Helm Action

Here's a sample workflow to demonstrate how to use this action:

```yaml
name: Generate Kustomized Helm Manifests

on:
  push:
    branches:
      - main

jobs:
  generate_manifests:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Generate manifests
        uses: your-github-username/kustomized-helm-action@v1
        with:
          source_folder: 'dev'
          destination_branch: 'manifests'
          helm_version: 'v3.14.4'
```

In this example, the action generates manifests for the Helm charts and Kustomize overlays in the `dev` directory and commits the changes to the `manifests` branch. It uses Helm version `v3.14.4`.

## Integrating Kustomized Helm Action with ArgoCD

By integrating the Kustomized Helm Action with ArgoCD, you can automate the deployment process further. ArgoCD will automatically detect changes in the destination branch and apply them to your cluster, ensuring that your deployments are always in sync with your repository.

## Get Started Today

The Kustomized Helm Action is a robust solution for managing Kubernetes manifests with ease. By automating the generation of manifests and integrating seamlessly with CI/CD pipelines and tools like ArgoCD, it simplifies the deployment process and enhances consistency across environments.

To get started, check out the [Kustomized Helm Action repository](https://github.com/jamesatintegratnio/kustomized-helm-action) and integrate it into your workflow today.

For more detailed instructions and best practices, visit our [official documentation](https://github.com/JamesAtIntegratnIO/kustomized-helm-action/blob/main/README.md).

Happy deploying!
