#!/bin/bash

# Check if required arguments are provided
if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <image-name> <tag>"
    echo "Example: $0 myapp latest"
    echo "Note: DOCKER_REGISTRY environment variable must be set"
    exit 1
fi

# Check if DOCKER_REGISTRY is set
if [ -z "${DOCKER_REGISTRY}" ]; then
    echo "Error: DOCKER_REGISTRY environment variable is not set"
    echo "Please set it first:"
    echo "export DOCKER_REGISTRY=prd1-tor.zeptile.software:5000"
    exit 1
fi

# Variables
IMAGE_NAME=$1
TAG=$2
FULL_IMAGE_NAME="${DOCKER_REGISTRY}/${IMAGE_NAME}:${TAG}"

# Check if Docker Desktop is running
if ! docker info >/dev/null 2>&1; then
    echo "Docker Desktop is not running. Please start it first."
    exit 1
fi

# Build the Docker image
echo "Building Docker image..."
docker build -t "$IMAGE_NAME:$TAG" .

if [ $? -ne 0 ]; then
    echo "Failed to build image"
    exit 1
fi

# Tag the local image with the registry prefix
echo "Tagging image as $FULL_IMAGE_NAME"
docker tag "$IMAGE_NAME:$TAG" "$FULL_IMAGE_NAME"

# Push the image to the registry
echo "Pushing image to registry..."
docker push "$FULL_IMAGE_NAME"

if [ $? -eq 0 ]; then
    echo "Successfully built and pushed $FULL_IMAGE_NAME"
else
    echo "Failed to push image. You may need to configure insecure registry."
    echo "Please follow these steps:"
    echo "1. Open Docker Desktop"
    echo "2. Click on Settings (gear icon)"
    echo "3. Go to Docker Engine"
    echo "4. Add this to the configuration:"
    echo "{
  \"insecure-registries\": [\"${DOCKER_REGISTRY}\"]
}"
    echo "5. Click Apply & Restart"
    echo "6. Run this script again"
    exit 1
fi

# Optional: Clean up local images
read -p "Do you want to remove the local images? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    docker rmi "$IMAGE_NAME:$TAG" "$FULL_IMAGE_NAME"
    echo "Local images removed"
fi 