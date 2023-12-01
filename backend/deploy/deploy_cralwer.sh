sed -i.bak "/lib\/\*\*\/\*.js/d" ../crawler/.gitignore
cd ../crawler; tsc
gcloud functions delete crawler
gcloud functions deploy crawler \
        --vpc-connector projects/chatbot-32ff4/locations/us-central1/connectors/chroma-connector \
        --region us-central1 \
        --allow-unauthenticated \
        --gen2 \
        --runtime nodejs20 \
        --trigger-http \
        --entry-point crawler \
        --source ../crawler \
        --memory 2048MB \
        --quiet
mv ../crawler/.gitignore.bak ../crawler/.gitignore
