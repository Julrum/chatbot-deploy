gcloud compute networks create chroma --subnet-mode=auto

gcloud compute networks vpc-access connectors create chroma-connector \
--network chroma \
--region us-central1 \
--range 10.8.0.0/28

gcloud compute instances create chroma-hyu-startup --machine-type e2-medium --network chroma --zone us-central1-a
