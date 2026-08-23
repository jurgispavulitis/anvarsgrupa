# Izvietošana uz Oracle Cloud (OCI) instances

Statiska vietne — vajadzīgs tikai nginx un atvērts 80. ports. Instrukcija pieņem
**Ubuntu** instanci; ja tā ir Oracle Linux, atšķiras tikai pakotņu komandas (piezīmes zemāk).

## 1. Atver 80. portu OCI tīkla līmenī (Security List)

OCI konsolē: **Networking → Virtual Cloud Networks → tava VCN → Security Lists →
Default Security List → Add Ingress Rules**:

- Source CIDR: `0.0.0.0/0`
- IP Protocol: `TCP`
- Destination Port Range: `80` (vēlāk arī `443`)

## 2. Atver 80. portu pašā instancē (iptables!)

**Biežākā OCI kļūme:** Oracle Ubuntu/Oracle Linux attēliem ir iebūvēti stingri
iptables noteikumi — ar Security List vien nepietiek. SSH uz instanci un:

```bash
sudo iptables -I INPUT 5 -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 5 -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save   # lai saglabājas pēc restarta (Ubuntu)
```

(Ja `netfilter-persistent` nav: `sudo apt install iptables-persistent`.)

## 3. Uzstādi nginx

```bash
sudo apt update && sudo apt install -y nginx     # Ubuntu
# Oracle Linux: sudo dnf install -y nginx && sudo systemctl enable --now nginx
```

## 4. nginx konfigurācija

Izveido `/etc/nginx/sites-available/anvarsgrupa`:

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /var/www/anvarsgrupa;
    index index.html;

    # Teksta failu saspiešana
    gzip on;
    gzip_types text/css application/javascript text/html image/svg+xml;
    gzip_min_length 1024;

    # Ilga kešatmiņa optimizētajiem medijiem
    location /images/opt/ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }

    location ~* \.(css|js)$ {
        expires 7d;
    }

    location / {
        try_files $uri $uri/ =404;
    }
}
```

Aktivizē un pārstartē:

```bash
sudo mkdir -p /var/www/anvarsgrupa
sudo ln -s /etc/nginx/sites-available/anvarsgrupa /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

(Oracle Linux nginx nelieto `sites-enabled` — konfigurāciju liec
`/etc/nginx/conf.d/anvarsgrupa.conf`.)

## 5. Augšupielādē vietni (no šī Windows datora)

No PowerShell projekta mapē. **Neaugšupielādē lielos oriģinālos medijus** —
vietne izmanto tikai `images/opt/`:

```powershell
cd C:\Users\Jurgis\Documents\anvars-grupa

# Pagaidu kopija bez liekā (oriģinālie video/foto ~200 MB paliek lokāli)
$dest = "$env:TEMP\anvars-deploy"
Remove-Item -Recurse -Force $dest -ErrorAction SilentlyContinue
robocopy . $dest /E /XD .git images node_modules /XF DEPLOY.md CLAUDE.md
robocopy images\opt $dest\images\opt /E

# Augšupielāde (nomaini IP un atslēgas ceļu)
scp -i C:\ceļš\uz\privāto_atslēgu -r "$dest\*" ubuntu@<INSTANCES_IP>:/tmp/site

# Instancē:
ssh -i C:\ceļš\uz\privāto_atslēgu ubuntu@<INSTANCES_IP>
sudo rsync -a --delete /tmp/site/ /var/www/anvarsgrupa/
sudo chown -R www-data:www-data /var/www/anvarsgrupa
rm -rf /tmp/site
```

Pārbaudi pārlūkā: `http://<INSTANCES_IP>/`

## 6. (Vēlāk) HTTPS ar Let's Encrypt

Kad būs domēns (piem., `anvarsgrupa.lv`) un tā A ieraksts norādīs uz instances IP:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d anvarsgrupa.lv -d www.anvarsgrupa.lv
```

Pirms tam nginx konfigurācijā `server_name _;` aizstāj ar
`server_name anvarsgrupa.lv www.anvarsgrupa.lv;` un atver 443. portu
(1. un 2. solis).

## 7. Automātiskā izvietošana ar GitHub Actions

Kad šis ir uzstādīts, katrs `git push origin main` pats atjauno vietni —
5. soli ar roku vairs nevajag.

### Kā tas strādā

```
tavs dators  --push-->  GitHub  --SSH-->  OCI serveris
                          |                    |
                          |                    | git pull (deploy atslēga)
                          +--------------------+
```

GitHub Actions **nesūta failus**. Tas tikai pieslēdzas serverim un pasaka:
"pavelc jaunāko versiju". Failus serveris paņem pats tieši no GitHub.

### Divas SSH atslēgas — nesajaukt!

| Atslēga | Kur glabājas | Ko atļauj |
|---|---|---|
| **Deploy atslēga** (jau izveidota) | privātā daļa — serverī; publiskā — GitHub repo iestatījumos | serveris drīkst lasīt GitHub repozitoriju |
| **Actions atslēga** (jāizveido) | privātā daļa — GitHub noslēpumā `OCI_SSH_KEY`; publiskā — servera `~/.ssh/authorized_keys` | GitHub drīkst ienākt serverī |

### A. Uz servera: noklonē repozitoriju

```bash
# Pārbauda, vai deploy atslēga strādā (aizstāj atslēgas nosaukumu ar savu)
ssh -T git@github.com -i ~/.ssh/id_ed25519
# Jāatbild: "Hi jurgispavulitis/anvarsgrupa! You've successfully authenticated..."

# Lai git automātiski lieto šo atslēgu
cat >> ~/.ssh/config <<'EOF'
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config

# Klonē mājas mapē (NEVIS /var/www — citādi .git būtu publiski lasāms!)
git clone git@github.com:jurgispavulitis/anvarsgrupa.git ~/anvarsgrupa
```

### B. Uz servera: atdod tīmekļa mapi deploy lietotājam

Tā `deploy.sh` iztiek bez `sudo`, un GitHub nevar serverī darīt neko vairāk.

```bash
sudo mkdir -p /var/www/anvarsgrupa
sudo chown -R "$USER":"$USER" /var/www/anvarsgrupa
sudo chmod -R 755 /var/www/anvarsgrupa
```

Pārbauda ar roku:

```bash
bash ~/anvarsgrupa/scripts/deploy.sh
```

### C. Uz servera: izveido atslēgu GitHub darbiniekam

```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_actions -N "" -C "github-actions"
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
cat ~/.ssh/github_actions        # <-- šo saturu iekopē GitHub noslēpumā
```

### D. GitHub: pievieno trīs noslēpumus

**Settings → Secrets and variables → Actions → New repository secret**

| Nosaukums | Vērtība |
|---|---|
| `OCI_HOST` | instances publiskā IP adrese |
| `OCI_USER` | `ubuntu` (vai `opc` uz Oracle Linux) |
| `OCI_SSH_KEY` | viss `~/.ssh/github_actions` saturs, ieskaitot `-----BEGIN`/`-----END` rindas |

### E. Pārbaude

GitHub → **Actions** → *Deploy* → **Run workflow**. Zaļš ķeksis = gatavs.
Turpmāk pietiek ar `git push origin main`.

### Ja neizdodas

- `Permission denied (publickey)` — `OCI_SSH_KEY` iekopēts nepilnīgi (trūkst
  pirmā/pēdējā rinda vai beigu jaunrinda).
- `Connection timed out` — 22. ports nav atvērts OCI Security List sarakstā.
- `Permission denied` uz `/var/www/anvarsgrupa` — nav izpildīts B solis.
- `could not read Username for 'https://github.com'` — repozitorijs noklonēts
  pa HTTPS, nevis SSH. Labo:
  `git -C ~/anvarsgrupa remote set-url origin git@github.com:jurgispavulitis/anvarsgrupa.git`

## Atjaunināšana turpmāk

`git push origin main` — viss pārējais notiek pats.
Avārijas gadījumā paliek arī vecais ceļš: 5. solis ar `robocopy` + `scp` + `rsync`.
