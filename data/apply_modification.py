import json, os, sys, base64, requests

# Load pending modification
with open('data/pending-modif.json', 'r') as f:
    modif = json.load(f)

if modif.get('statut') == 'traite':
    print("Already treated, skipping.")
    sys.exit(0)

client = modif.get('client', '')
commerce = modif.get('commerce', '')
email = modif.get('email', '')
sujet = modif.get('sujet', '')
message = modif.get('message', '')
context_data = modif.get('context_data', '')
site_slug = modif.get('site_slug', 'Lise')
site_file = modif.get('site_file', 'onboarding.html')

print(f"Processing: {sujet} for {commerce}")

# Fetch current HTML
html_url = f"https://raw.githubusercontent.com/dwtdigital-clients/dwtdigital-clients.github.io/main/{site_slug}/{site_file}"
resp = requests.get(html_url)
html = resp.text
print(f"HTML fetched: {len(html)} chars")

# Call Claude API
import anthropic
client_ai = anthropic.Anthropic(api_key=os.environ['ANTHROPIC_API_KEY'])

prompt = f"""Tu es expert en développement web pour sites vitrines de commerces locaux français.

DEMANDE DE MODIFICATION:
Client: {client} | Commerce: {commerce}
Sujet: {sujet}
Message: {message}
Données complémentaires: {context_data}

SITE HTML ACTUEL:
{html}

INSTRUCTIONS STRICTES:
- Applique EXACTEMENT la modification demandée par le client
- Intègre les données complémentaires (listes de produits, prix, horaires, etc.) si fournies
- Ne change RIEN d'autre que ce qui est demandé
- Retourne UNIQUEMENT le HTML complet modifié, sans commentaires, sans backticks, sans explication
- Le HTML doit être complet et 100% fonctionnel"""

response = client_ai.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=8000,
    messages=[{"role": "user", "content": prompt}]
)

modified_html = response.content[0].text
print(f"Claude responded: {len(modified_html)} chars")

# Save modified HTML
with open(f'{site_slug}/{site_file}', 'w', encoding='utf-8') as f:
    f.write(modified_html)
print(f"Saved {site_slug}/{site_file}")

# Update pending-modif.json to mark as treated
import datetime
modif['statut'] = 'traite'
modif['date_traitement'] = datetime.datetime.now().strftime('%d/%m/%Y %H:%M')
with open('data/pending-modif.json', 'w') as f:
    json.dump(modif, f, ensure_ascii=False, indent=2)

# Update latest-modif.json
with open('data/latest-modif.json', 'w') as f:
    json.dump({**modif, 'site_url': f'https://dwtdigital-clients.github.io/{site_slug}/{site_file}'}, f, ensure_ascii=False, indent=2)

# Send Telegram notification
tg_token = os.environ.get('TELEGRAM_TOKEN')
chat_id = os.environ.get('TELEGRAM_CHAT')
if tg_token and chat_id:
    msg = f"✅ MODIFICATION APPLIQUÉE\n\nClient : {client} — {commerce}\nSujet : {sujet}\n\n🌐 https://dwtdigital-clients.github.io/{site_slug}/{site_file}\n⏱ En ligne dans ~2 min\n📊 https://dwtdigital-clients.github.io/dashboard-ceo.html"
    requests.post(f"https://api.telegram.org/bot{tg_token}/sendMessage", json={"chat_id": chat_id, "text": msg})
    print("Telegram sent!")

print("Done!")
