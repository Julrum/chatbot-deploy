sed -i.bak "/lib\/\*\*\/\*.js/d" ../chroma/.gitignore
cd ../chroma; tsc
gcloud functions deploy chroma \
        --vpc-connector projects/chatbot-32ff4/locations/us-central1/connectors/chroma-connector \
        --region us-central1 \
        --allow-unauthenticated \
        --gen2 \
        --runtime nodejs20 \
        --trigger-http \
        --entry-point chroma \
        --source ../chroma
mv ../chroma/.gitignore.bak ../chroma/.gitignore
