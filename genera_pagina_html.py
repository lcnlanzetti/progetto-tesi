"""
Crea la pagina web che mostra i risultati.

Prende i risultati di enumerazione_percorsi.py (i giri più corti) e di
confronto_economico.py (i costi), e li inserisce nel modello di pagina
template_pagina.html. Copia dentro la pagina anche la grafica (cartella css/)
e i programmi che la fanno funzionare (cartella js/).

Il risultato è un solo file, pagina/index.html, che si apre con un doppio
clic in qualsiasi browser, anche senza internet.

Per avviarlo:  python3 genera_pagina_html.py
"""

import json
import re
from pathlib import Path

import enumerazione_percorsi as ep
import confronto_economico as ce

# Posizione sulla mappa (latitudine, longitudine) di ogni paese.
# Serve solo a disegnare i paesi al posto giusto nella pagina:
# per i calcoli si usano sempre i km di strada.
COORDINATE = {
    "Monno": (46.2116, 10.3399),
    "Incudine": (46.2205, 10.3589),
    "Edolo": (46.1806, 10.3333),
    "Vezza d'Oglio": (46.2402, 10.3997),
    "Vione": (46.2484, 10.4472),
    "Malonno": (46.1226, 10.3192),
}

# Quanti giri dello scenario 1 mostrare nella tabella della pagina
SEQUENZE_IN_CLASSIFICA = 12

# Nel modello di pagina c'è la riga  const DATI = /*__DATI__*/ null;
# questo script sostituisce "/*__DATI__*/ null" con i risultati.
# Si cerca anche "const DATI =" davanti, così una scritta uguale messa
# per esempio in un commento non viene presa per sbaglio.
SEGNAPOSTO_DATI = re.compile(r"(const DATI\s*=\s*)/\*__DATI__\*/\s*null")

# Le righe del modello che caricano i file di grafica e i programmi:
# vengono sostituite con il contenuto di quei file.
FOGLIO_DI_STILE = re.compile(r'<link rel="stylesheet" href="([^"]+)"\s*/?>')
SCRIPT_ESTERNO = re.compile(r'<script src="([^"]+)"></script>')


# ---------------------------------------------------------------------------
# 1. DATI PER LA PAGINA
# ---------------------------------------------------------------------------
# I programmi in js/ leggono questi dati con questi nomi esatti:
# se si cambia un nome qui, va cambiato anche lì.

def dati_nodi():
    """Deposito e clienti, con posizione sulla mappa e kg da consegnare (0 per il deposito)."""
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
        "n_ottime": len(giri_ottimi),  # quanti giri sono lunghi quanto il migliore
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
    """Copia dentro la pagina il contenuto dei file css/ e js/ che il modello richiama."""
    def leggi(percorso_relativo):
        return (cartella / percorso_relativo).read_text(encoding="utf-8")

    html = FOGLIO_DI_STILE.sub(
        lambda m: f"<style>\n{leggi(m.group(1))}</style>", html)
    html = SCRIPT_ESTERNO.sub(
        lambda m: f"<script>\n{leggi(m.group(1))}</script>", html)
    return html


def inserisci_dati(html, dati):
    """Scrive i risultati nella pagina, al posto della scritta /*__DATI__*/ null."""
    trovati = len(SEGNAPOSTO_DATI.findall(html))
    if trovati != 1:
        raise ValueError(
            "Nel modello deve esserci una sola riga 'const DATI = /*__DATI__*/ null', "
            f"trovate: {trovati}.")
    # JSON è un formato di testo che i programmi della pagina sanno leggere
    testo_json = json.dumps(dati, ensure_ascii=False)
    # si usa una funzione perché un eventuale "\" nel testo resti com'è
    return SEGNAPOSTO_DATI.sub(lambda m: m.group(1) + testo_json, html)


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
