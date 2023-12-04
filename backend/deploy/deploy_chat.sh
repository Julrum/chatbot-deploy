sed -i.bak "/lib\/\*\*\/\*.js/d" ../chat/.gitignore
cd ../chat; tsc
gcloud functions deploy chat \
        --region us-central1 \
        --allow-unauthenticated \
        --gen2 \
        --runtime nodejs20 \
        --trigger-http \
        --entry-point chat \
        --source ../chat \
        --timeout 300s

mv ../chat/.gitignore.bak ../chat/.gitignore

