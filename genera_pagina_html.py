"""
Project Work – Traccia 23
Generazione della pagina HTML dei risultati.

Lo script riusa i moduli enumerazione_percorsi.py e confronto_economico.py,
raccoglie grafo, percorsi ottimi e parametri di costo, e li inserisce nel
modello template_pagina.html. I fogli di stile (css/) e gli script (js/)
richiamati dal modello vengono copiati dentro la pagina, così il risultato
è un unico file autonomo, pagina/index.html, apribile con qualsiasi
browser anche senza connessione.

Uso:  python3 genera_pagina_html.py
"""

import json
import re
from pathlib import Path

import enumerazione_percorsi as ep
import confronto_economico as ce

# Coordinate (lat, lon) dei centri dei comuni, usate solo per disegnare
# il grafo in proporzione: le distanze del modello restano quelle stradali.
COORDINATE = {
    "Monno": (46.2116, 10.3399),
    "Incudine": (46.2205, 10.3589),
    "Edolo": (46.1806, 10.3333),
    "Vezza d'Oglio": (46.2402, 10.3997),
    "Vione": (46.2484, 10.4472),
    "Malonno": (46.1226, 10.3192),
}

# Quante sequenze dello scenario 1 mostrare nella tabella della pagina
SEQUENZE_IN_CLASSIFICA = 12

# Segnaposto nel modello HTML che viene sostituito con i dati.
# Accetta spazi tra commento e "null", che un formattatore può aggiungere.
SEGNAPOSTO_DATI = re.compile(r"/\*__DATI__\*/\s*null")

# Riferimenti a file esterni nel modello, da sostituire con il loro contenuto
FOGLIO_DI_STILE = re.compile(r'<link rel="stylesheet" href="([^"]+)"\s*/?>')
SCRIPT_ESTERNO = re.compile(r'<script src="([^"]+)"></script>')


# ---------------------------------------------------------------------------
# 1. DATI PER LA PAGINA
# ---------------------------------------------------------------------------
# I nomi delle chiavi sono quelli letti dagli script in js/ (oggetto DATI).

def dati_nodi():
    """Deposito e clienti, con coordinate e kg richiesti (0 per il deposito)."""
    return [
        {
            "id": indice,
            "nome": nome,
            "lat": COORDINATE[nome][0],
            "lon": COORDINATE[nome][1],
            "domanda": ep.domanda.get(indice, 0),
        }
        for indice, nome in enumerate(ep.nodi)
    ]


def dati_scenario_1(s1):
    giri_ottimi = [giro for giro in s1["classifica"]
                   if abs(giro["km"] - s1["km"]) < ep.TOLLERANZA_KM]
    return {
        "sequenza": list(s1["sequenza"]),
        "km": round(s1["km"], 1),
        "esaminate": s1["esaminate"],
        "n_ottime": len(giri_ottimi),  # sequenze a pari merito con la migliore
        "classifica": [
            {"km": round(giro["km"], 1), "sequenza": list(giro["sequenza"])}
            for giro in s1["classifica"][:SEQUENZE_IN_CLASSIFICA]
        ],
    }


def dati_giro(giro):
    return {
        "sequenza": list(giro["sequenza"]),
        "km": round(giro["km"], 1),
        "kg": giro["kg"],
    }


def dati_scenario_2(s2):
    return {
        "suddivisioni": s2["suddivisioni"],
        "scartate": s2["scartate"],
        "ammissibili": [
            {
                "km": round(soluzione["km"], 1),
                "veicoli": [dati_giro(giro) for giro in soluzione["veicoli"]],
            }
            for soluzione in s2["ammissibili"]
        ],
    }


def dati_parametri():
    """Valori iniziali dei cursori della pagina."""
    return {
        "prezzo_gasolio": ce.PREZZO_GASOLIO,
        "costo_orario": ce.COSTO_ORARIO_AUTISTA,
        "velocita": ce.VELOCITA_MEDIA,
        "tempo_scarico": ce.TEMPO_SCARICO,
        "tempo_carico": ce.TEMPO_CARICO,
        "veicoli": ce.VEICOLI,
        "giorni_anno": ce.GIORNI_ANNO,
    }


def raccogli_dati():
    return {
        "nodi": dati_nodi(),
        "distanze": ep.distanze,
        "capacita": {"s1": ep.CAPACITA_SCENARIO_1, "s2": ep.CAPACITA_SCENARIO_2},
        "scenario1": dati_scenario_1(ep.scenario_1()),
        "scenario2": dati_scenario_2(ep.scenario_2()),
        "parametri": dati_parametri(),
    }


# ---------------------------------------------------------------------------
# 2. COSTRUZIONE DEL FILE HTML
# ---------------------------------------------------------------------------

def includi_file_esterni(html, cartella):
    """Sostituisce i <link> ai fogli di stile e gli <script src> con il loro contenuto."""
    def leggi(percorso_relativo):
        return (cartella / percorso_relativo).read_text(encoding="utf-8")

    html = FOGLIO_DI_STILE.sub(
        lambda m: f"<style>\n{leggi(m.group(1))}</style>", html)
    html = SCRIPT_ESTERNO.sub(
        lambda m: f"<script>\n{leggi(m.group(1))}</script>", html)
    return html


def inserisci_dati(html, dati):
    """Mette i dati (in formato JSON) al posto del segnaposto del modello."""
    if not SEGNAPOSTO_DATI.search(html):
        raise ValueError("Segnaposto /*__DATI__*/ null non trovato nel modello.")
    testo_json = json.dumps(dati, ensure_ascii=False)
    # si passa una funzione, così eventuali "\" nel JSON non vengono interpretati
    return SEGNAPOSTO_DATI.sub(lambda _: testo_json, html, count=1)


def main():
    cartella = Path(__file__).parent
    modello = (cartella / "template_pagina.html").read_text(encoding="utf-8")

    html = includi_file_esterni(modello, cartella)
    html = inserisci_dati(html, raccogli_dati())

    uscita = cartella / "pagina" / "index.html"
    uscita.parent.mkdir(exist_ok=True)
    uscita.write_text(html, encoding="utf-8")
    print(f"Pagina generata: {uscita}")


if __name__ == "__main__":
    main()
