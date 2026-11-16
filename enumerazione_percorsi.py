"""
Project Work – Traccia 23
Pianificazione dei percorsi di consegna con enumerazione completa (TSP e VRP).

Deposito: Monno. Clienti: Incudine, Edolo, Vezza d'Oglio, Vione, Malonno.

Scenario 1: un solo veicolo da 300 kg serve tutti i clienti (TSP).
Scenario 2: due veicoli identici da 150 kg (VRP con vincolo di capacità).

Nessuna euristica e nessun solutore: il programma genera ed esamina
tutte le soluzioni ammissibili e sceglie quella con meno km.

Uso:  python3 enumerazione_percorsi.py
"""

from itertools import combinations, permutations

# ---------------------------------------------------------------------------
# 1. DATI DEL PROBLEMA
# ---------------------------------------------------------------------------

# Nodo 0 = deposito, nodi 1-5 = clienti
nodi = ["Monno", "Incudine", "Edolo", "Vezza d'Oglio", "Vione", "Malonno"]

# Matrice delle distanze stradali in km (simmetrica):
# distanze[i][j] = km per andare dal nodo i al nodo j
distanze = [
    # Monno Incud. Edolo  Vezza  Vione  Malonno
    [0.0,  3.1,   6.6,   7.0,   11.4,  14.9],  # Monno (deposito)
    [3.1,  0.0,   5.5,   3.9,   8.3,   13.8],  # Incudine
    [6.6,  5.5,   0.0,   9.4,   13.8,  8.3],   # Edolo
    [7.0,  3.9,   9.4,   0.0,   4.7,   17.7],  # Vezza d'Oglio
    [11.4, 8.3,   13.8,  4.7,   0.0,   22.1],  # Vione
    [14.9, 13.8,  8.3,   17.7,  22.1,  0.0],   # Malonno
]

# Quantità da consegnare a ciascun cliente (kg, dati simulati)
domanda = {1: 40, 2: 70, 3: 50, 4: 30, 5: 60}

DEPOSITO = 0
CLIENTI = list(domanda.keys())

CAPACITA_SCENARIO_1 = 300  # kg, l'unico veicolo
CAPACITA_SCENARIO_2 = 150  # kg, ciascuno dei due veicoli

# Tolleranza per confrontare km calcolati come somme di numeri decimali
TOLLERANZA_KM = 1e-9


# ---------------------------------------------------------------------------
# 2. FUNZIONI DI SUPPORTO
# ---------------------------------------------------------------------------

def giro_completo(sequenza):
    """Aggiunge partenza e ritorno al deposito: (2, 5) -> [0, 2, 5, 0]."""
    return [DEPOSITO] + list(sequenza) + [DEPOSITO]


def lunghezza_percorso(sequenza):
    """Km di un giro: deposito -> clienti nell'ordine dato -> deposito."""
    giro = giro_completo(sequenza)
    tratti = zip(giro[:-1], giro[1:])  # coppie di nodi consecutivi
    return sum(distanze[da][a] for da, a in tratti)


def carico(clienti):
    """Kg totali da consegnare a un gruppo di clienti."""
    return sum(domanda[cliente] for cliente in clienti)


def nomi(sequenza):
    """Percorso leggibile, es. Monno -> Edolo -> Malonno -> Monno."""
    return " -> ".join(nodi[nodo] for nodo in giro_completo(sequenza))


def miglior_giro(clienti):
    """
    TSP per enumerazione completa: prova tutti gli ordini possibili
    dei clienti e restituisce (sequenza migliore, km).
    A parità di km si tiene la prima sequenza trovata.
    """
    sequenza_migliore, km_minimi = None, float("inf")
    for sequenza in permutations(clienti):
        km = lunghezza_percorso(sequenza)
        if km < km_minimi - TOLLERANZA_KM:
            sequenza_migliore, km_minimi = sequenza, km
    return sequenza_migliore, km_minimi


# ---------------------------------------------------------------------------
# 3. SCENARIO 1 – UN VEICOLO DA 300 KG (TSP)
# ---------------------------------------------------------------------------

def scenario_1():
    """
    Esamina tutte le 5! = 120 sequenze di visita dei clienti.

    Restituisce un dizionario con:
      sequenza    ordine di visita migliore (tupla di indici dei clienti)
      km          lunghezza del giro migliore
      carico      kg trasportati
      esaminate   numero di sequenze provate
      classifica  tutte le sequenze, dalla più corta:
                  lista di {"km": ..., "sequenza": ...}
    """
    if carico(CLIENTI) > CAPACITA_SCENARIO_1:
        raise ValueError("Il veicolo non ha capacità sufficiente.")

    classifica = [
        {"km": lunghezza_percorso(sequenza), "sequenza": sequenza}
        for sequenza in permutations(CLIENTI)
    ]
    # sorted è stabile: a parità di km resta l'ordine di generazione
    classifica.sort(key=lambda giro: giro["km"])

    migliore = classifica[0]
    return {
        "sequenza": migliore["sequenza"],
        "km": migliore["km"],
        "carico": carico(CLIENTI),
        "esaminate": len(classifica),
        "classifica": classifica,
    }


# ---------------------------------------------------------------------------
# 4. SCENARIO 2 – DUE VEICOLI DA 150 KG (VRP)
# ---------------------------------------------------------------------------

def giro_veicolo(clienti):
    """Giro migliore di un veicolo su un gruppo di clienti."""
    sequenza, km = miglior_giro(clienti)
    return {"sequenza": sequenza, "km": km, "kg": carico(clienti)}


def suddivisioni_in_due_gruppi(clienti):
    """
    Genera tutte le divisioni dei clienti in due gruppi non vuoti.

    Poiché i veicoli sono identici, {A,B}+{C} e {C}+{A,B} sono la stessa
    soluzione: per non contarla due volte il primo cliente sta sempre
    nel gruppo 1, e si sceglie solo chi lo accompagna.
    Con 5 clienti si ottengono 2^4 - 1 = 15 suddivisioni.
    """
    primo, altri = clienti[0], clienti[1:]
    for quanti_compagni in range(len(altri) + 1):
        for compagni in combinations(altri, quanti_compagni):
            gruppo_1 = (primo,) + compagni
            gruppo_2 = tuple(c for c in clienti if c not in gruppo_1)
            if gruppo_2:  # se è vuoto, un veicolo resterebbe inutilizzato
                yield gruppo_1, gruppo_2


def scenario_2():
    """
    Per ogni suddivisione che rispetta la capacità di entrambi i veicoli
    si calcola il giro migliore di ciascuno, sempre per enumerazione completa.

    Restituisce un dizionario con:
      migliore      la soluzione con meno km totali
      suddivisioni  numero di suddivisioni esaminate
      scartate      quante superano la capacità di un veicolo
      ammissibili   tutte le soluzioni valide, dalla più corta:
                    {"veicoli": [giro_1, giro_2], "km": totale}
                    dove ogni giro è {"sequenza", "km", "kg"}
    """
    soluzioni, suddivisioni, scartate = [], 0, 0

    for gruppo_1, gruppo_2 in suddivisioni_in_due_gruppi(CLIENTI):
        suddivisioni += 1

        troppo_carico = (carico(gruppo_1) > CAPACITA_SCENARIO_2
                         or carico(gruppo_2) > CAPACITA_SCENARIO_2)
        if troppo_carico:
            scartate += 1
            continue

        giri = [giro_veicolo(gruppo_1), giro_veicolo(gruppo_2)]
        soluzioni.append({
            "veicoli": giri,
            "km": giri[0]["km"] + giri[1]["km"],
        })

    soluzioni.sort(key=lambda soluzione: soluzione["km"])
    return {
        "migliore": soluzioni[0],
        "suddivisioni": suddivisioni,
        "scartate": scartate,
        "ammissibili": soluzioni,
    }


# ---------------------------------------------------------------------------
# 5. STAMPA DEI RISULTATI
# ---------------------------------------------------------------------------

def titolo(testo):
    print("=" * 70)
    print(testo)
    print("=" * 70)


def stampa_scenario_1(s1):
    titolo("SCENARIO 1 – Un veicolo da 300 kg")
    print(f"Sequenze esaminate: {s1['esaminate']}")
    print(f"Percorso ottimo:    {nomi(s1['sequenza'])}")
    print(f"Distanza totale:    {s1['km']:.1f} km")
    print(f"Carico:             {s1['carico']} / {CAPACITA_SCENARIO_1} kg")
    print("\nLe 5 sequenze migliori:")
    for giro in s1["classifica"][:5]:
        print(f"  {giro['km']:5.1f} km  {nomi(giro['sequenza'])}")


def stampa_scenario_2(s2):
    titolo("SCENARIO 2 – Due veicoli da 150 kg")
    print(f"Suddivisioni esaminate:       {s2['suddivisioni']}")
    print(f"Scartate per capacità:        {s2['scartate']}")
    print(f"Ammissibili:                  {len(s2['ammissibili'])}")

    migliore = s2["migliore"]
    for numero, giro in enumerate(migliore["veicoli"], start=1):
        print(f"Veicolo {numero}: {nomi(giro['sequenza'])}")
        print(f"           {giro['km']:.1f} km, {giro['kg']} / {CAPACITA_SCENARIO_2} kg")
    print(f"Distanza totale: {migliore['km']:.1f} km")

    print("\nTutte le suddivisioni ammissibili, dalla migliore:")
    for soluzione in s2["ammissibili"]:
        gruppi = [", ".join(nodi[c] for c in giro["sequenza"])
                  for giro in soluzione["veicoli"]]
        print(f"  {soluzione['km']:5.1f} km  [{gruppi[0]}] + [{gruppi[1]}]")


def stampa_confronto(s1, s2):
    titolo("CONFRONTO")
    km_in_piu = s2["migliore"]["km"] - s1["km"]
    percentuale = km_in_piu / s1["km"] * 100
    print(f"Scenario 1: {s1['km']:.1f} km")
    print(f"Scenario 2: {s2['migliore']['km']:.1f} km  "
          f"(+{km_in_piu:.1f} km, +{percentuale:.1f}%)")


def stampa_risultati():
    s1 = scenario_1()
    s2 = scenario_2()
    stampa_scenario_1(s1)
    print()
    stampa_scenario_2(s2)
    print()
    stampa_confronto(s1, s2)
    return s1, s2


if __name__ == "__main__":
    stampa_risultati()
