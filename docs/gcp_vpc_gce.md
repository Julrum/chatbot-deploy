# GCP VPC & Compute Engine Deployment

chroma network 생성 (`subnet-mode=auto` 옵션 때문에 동일한 이름("chroma")의 서브넷이 region 별로 생성된다.)
```bash
gcloud compute networks create chroma --subnet-mode=auto
```

chroma network 내부의 GCE 인스턴스에 SSH 가능하도록 IAP에 예약된 35.235.240.0/20 대역으로부터의 인그레스 트래픽 허용
```bash
gcloud compute firewall-rules create allow-ssh-ingress-from-iap \
  --direction=INGRESS \
  --action=allow \
  --rules=tcp:22 \
  --source-ranges=35.235.240.0/20 \
  --network chroma
```

VPC Connector에 예약된 대역인 35.199.224.0/19 에서 chroma network로 들어오는 VPC Connector 트래픽 허용
- [관련 문서](https://cloud.google.com/vpc/docs/configure-serverless-vpc-access#restrict-access)
```bash
gcloud compute firewall-rules create allow-vpc-connector-ingress \
  --action=ALLOW \
  --rules=TCP \
  --source-ranges=35.199.224.0/19 \
  --target-tags=vpc-connector-us-central1-chroma-connector \
  --direction=INGRESS \
  --network=chroma \
  --priority=0 \
  --project=chatbot-32ff4
```

VPC Connector에 연결된 Cloud Function 배포
```bash
gcloud functions deploy crawler \
  --vpc-connector projects/chatbot-32ff4/locations/us-central1/connectors/chroma-connector \
  --region us-central1 \
  --allow-unauthenticated \
  --gen2 \
  --runtime nodejs20 \
  --trigger-http \
  --entry-point crawler \
  --source ../crawler
```
- cloud function 배포 명령어 실행 시 `lib/index.js`를 찾을 수 없다는 에러
  - gitignore 파일 관련 문제이다.
  - gcloud CLI의 버그로 인해, gcloudignore 뿐만 아니라 gitignore에 기재된 lib/*.js 파일들까지 모두 무시되고 있다.
    - lib/*.js 파일은 tsc 컴파일러가 출력한 파일이므로 git에서는 제외되어야 한다.
    - 하지만 실제로 실행 가능한 js 파일이 필요한 cloud function 배포 시에는 포함되어야 한다.
  - 아래 명령어로 일시적으로 lib/*.js 파일들을 gitignore에서 지울 수 있다.
  ```bash
  sed -i.bak "/lib\/\*\*\/\*.js/d" backend/crawler/.gitignore
  ```
  - 위 명령어는 `.gitignore.bak` 이라는 백업 파일을 생성하므로, gcloud functions deploy 실행 이후 다시 `.gitignore.bak` 으로 `.gitignore`를 덮어 쓰면 된다.

Chat API도 마찬가지로 Chroma 서버에 접속해야 하므로 동일한 VPC Connector에 연결해 준다.
```bash
gcloud functions deploy chat \
  --vpc-connector projects/chatbot-32ff4/locations/us-central1/connectors/chroma-connector \
  --region us-central1 \
  --allow-unauthenticated \
  --gen2 \
  --runtime nodejs20 \
  --trigger-http \
  --entry-point chat \
  --source ../chat
```

chroma network 외부 정적 아이피 생성
```bash
gcloud compute addresses create chroma-static --region=us-central1
```

외부 아이피 주소값 확인 (34.172.161.176)
```bash
gcloud compute addresses describe chroma-static --region us-central1
```

chroma subnet 내부 정적 아이피 생성
```bash
gcloud compute addresses create chroma-internal --region us-central1 --subnet chroma
```

내부 아이피 주소값 확인 (10.128.0.4)
```bash
gcloud compute addresses describe chroma-internal --region us-central1
```
생성된 내/외부 정적 아이피를 사용하는 GCE 인스턴스 생성
```bash
gcloud compute instances create chroma-hyu-startup \
  --machine-type e2-medium \
  --network chroma \
  --zone us-central1-a \
  --address 34.172.161.176 \
  --private-network-ip 10.128.0.4
```

GCE 인스턴스 내부에서 도커 설치 및 chroma 컨테이너 실행
- 인스턴스에 SSH로 접속한다.
> `tunnel-through-iap` 옵션이 있어야 IAP Tunneling으로 VPC 내의 인스턴스에 SSH 가능함
```bash
gcloud compute ssh chroma-hyu-startup \
  --project=chatbot-32ff4 \
  --zone=us-central1-a \
  --tunnel-through-iap
```
- SSH로 접속한 인스턴스 내부 Shell에서 아래의 Shell Script를 실행
```bash
# Add Docker's official GPG key:
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo docker run hello-world
sudo docker run -d -p 8000:8000 chromadb/chroma:latest
```

VPC Serverless Access Connector 생성
- range는 서버리스 리소스 (CF 등) 들이 위치할 아이피 대역이다.
  - [관련 문서](https://cloud.google.com/vpc/docs/serverless-vpc-access#example_2)
```bash
gcloud compute networks vpc-access connectors create chroma-connector \
--network chroma \
--region us-central1 \
--range 10.8.0.0/28
```
위 명령어에서 아래와 같은 에러가 발생할 수 있다.
```text
ERROR: (gcloud.compute.networks.vpc-access.connectors.create) {
  "code": 9,
  "message": "Operation failed: Insufficient CPU quota in region."
}
```
이 경우에는, 아래와 같이 최대/최소 인스턴스 개수를 명시해주면 된다. [관련 Stackoverflow](https://stackoverflow.com/questions/70562667/creating-new-gcp-serverless-vpc-access-connection-error-insufficient-cpu-quota)
```bash
gcloud compute networks vpc-access connectors create chroma-connector \
--network chroma \
--region us-central1 \
--range 10.8.0.0/28 \
--min-instances 2 \
--max-instances 3
```

VPC Serverless Access Connector 확인
```bash
gcloud compute networks vpc-access connectors describe chroma-connector --region us-central1
```

위 과정을 수행했다면, VPC Connector에 연결되어 배포된 Cloud Function들에서 아래 REST API가 정상 호출되어야 한다.
```bash
curl -X GET http://10.128.0.4:8000/api/v1
```
아래 API는 chroma db의 heartbeat API 주소이다. 정상적인 상황이라면 아래와 같은 heartbeat response가 돌아와야 한다.
```text
{"nanosecond heartbeat":1701170093581068961}
```
만약 OpenSSL Error가 발생했다면, 주소 앞부분을 `https`가 아닌 `http`로 제대로 기재 하였는지 확인할 것.

Reference
[VPC Access Overview](https://cloud.google.com/vpc/docs/serverless-vpc-access)
[Create and manage VPC networks](https://cloud.google.com/vpc/docs/create-modify-vpc-networks)
[Connect to a VPC network](https://cloud.google.com/vpc/docs/configure-serverless-vpc-access#restrict-access)
[Static Internal IP Address](https://cloud.google.com/compute/docs/ip-addresses/reserve-static-internal-ip-address#create_a_vm_instance_with_a_specific_internal_ip_address)
[Reserve a static external IP address](https://cloud.google.com/compute/docs/ip-addresses/reserve-static-external-ip-address#reserve_new_static)
