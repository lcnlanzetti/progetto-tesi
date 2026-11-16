"""
Trova il giro di consegne più corto, in km.

I furgoni partono dal deposito di Monno, consegnano a cinque clienti
(Incudine, Edolo, Vezza d'Oglio, Vione, Malonno) e tornano a Monno.
Si confrontano due modi di organizzare le consegne:

  Scenario 1  un solo furgone da 300 kg visita tutti i clienti.
  Scenario 2  due furgoni da 150 kg si dividono i clienti.

Il programma non usa scorciatoie: prova tutte le combinazioni possibili,
calcola i km di ognuna e tiene la più corta. Con soli cinque clienti
le combinazioni sono poche e il calcolo è immediato.

Per avviarlo:  python3 enumerazione_percorsi.py
"""

from itertools import combinations, permutations

# ---------------------------------------------------------------------------
# 1. DATI DEL PROBLEMA
# ---------------------------------------------------------------------------

# Ogni luogo è indicato da un numero: 0 è il deposito, da 1 a 5 i clienti.
nodi = ["Monno", "Incudine", "Edolo", "Vezza d'Oglio", "Vione", "Malonno"]

# Km di strada tra ogni coppia di luoghi.
# Si legge così: distanze[2][5] = km da Edolo (2) a Malonno (5).
# La tabella è simmetrica: andata e ritorno hanno la stessa lunghezza.
distanze = [
    # Monno Incud. Edolo  Vezza  Vione  Malonno
    [0.0,  3.1,   6.6,   7.0,   11.4,  14.9],  # Monno (deposito)
    [3.1,  0.0,   5.5,   3.9,   8.3,   13.8],  # Incudine
    [6.6,  5.5,   0.0,   9.4,   13.8,  8.3],   # Edolo
    [7.0,  3.9,   9.4,   0.0,   4.7,   17.7],  # Vezza d'Oglio
    [11.4, 8.3,   13.8,  4.7,   0.0,   22.1],  # Vione
    [14.9, 13.8,  8.3,   17.7,  22.1,  0.0],   # Malonno
]

# Kg di merce da consegnare a ogni cliente (valori inventati per l'esempio).
domanda = {1: 40, 2: 70, 3: 50, 4: 30, 5: 60}

DEPOSITO = 0
CLIENTI = list(domanda.keys())

# Quanti kg può portare al massimo un furgone
CAPACITA_SCENARIO_1 = 300  # l'unico furgone dello scenario 1
CAPACITA_SCENARIO_2 = 150  # ciascuno dei due furgoni dello scenario 2

# Il computer somma i decimali con piccolissimi errori di arrotondamento
# (es. 0.1 + 0.2 = 0.30000000000000004). Due percorsi che differiscono
# meno di questa quantità sono considerati lunghi uguali.
TOLLERANZA_KM = 1e-9


# ---------------------------------------------------------------------------
# 2. FUNZIONI DI SUPPORTO
# ---------------------------------------------------------------------------

def giro_completo(sequenza):
    """
    Aggiunge la partenza e il ritorno al deposito.
    Esempio: clienti (2, 5) -> giro [0, 2, 5, 0], cioè Monno, Edolo, Malonno, Monno.
    """
    return [DEPOSITO] + list(sequenza) + [DEPOSITO]


def lunghezza_percorso(sequenza):
    """Km totali di un giro che visita i clienti nell'ordine indicato."""
    giro = giro_completo(sequenza)
    # tratti: ogni coppia di tappe consecutive, es. (0, 2), (2, 5), (5, 0)
    tratti = zip(giro[:-1], giro[1:])
    return sum(distanze[da][a] for da, a in tratti)


def carico(clienti):
    """Kg totali da consegnare a un gruppo di clienti."""
    return sum(domanda[cliente] for cliente in clienti)


def nomi(sequenza):
    """Scrive il giro con i nomi dei paesi, es. Monno -> Edolo -> Malonno -> Monno."""
    return " -> ".join(nodi[nodo] for nodo in giro_completo(sequenza))


def miglior_giro(clienti):
    """
    Trova l'ordine di visita più corto per un gruppo di clienti,
    provando tutti gli ordini possibili uno per uno.
    Restituisce (ordine migliore, km). Se due ordini hanno gli stessi km
    si tiene il primo trovato.
    """
    sequenza_migliore, km_minimi = None, float("inf")
    for sequenza in permutations(clienti):
        km = lunghezza_percorso(sequenza)
        if km < km_minimi - TOLLERANZA_KM:
            sequenza_migliore, km_minimi = sequenza, km
    return sequenza_migliore, km_minimi


# ---------------------------------------------------------------------------
# 3. SCENARIO 1 – UN FURGONE DA 300 KG
# ---------------------------------------------------------------------------

def scenario_1():
    """
    Prova tutti i 120 ordini in cui un solo furgone può visitare
    i cinque clienti (5 x 4 x 3 x 2 x 1 = 120) e li mette in classifica.

    Restituisce un dizionario con:
      sequenza    l'ordine di visita più corto (numeri dei clienti)
      km          i km di quel giro
      carico      i kg trasportati
      esaminate   quanti ordini sono stati provati
      classifica  tutti gli ordini, dal più corto al più lungo,
                  ciascuno come {"km": ..., "sequenza": ...}
    """
    if carico(CLIENTI) > CAPACITA_SCENARIO_1:
        raise ValueError("Il veicolo non ha capacità sufficiente.")

    classifica = [
        {"km": lunghezza_percorso(sequenza), "sequenza": sequenza}
        for sequenza in permutations(CLIENTI)
    ]
    # a parità di km, i giri restano nell'ordine in cui sono stati generati
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
# 4. SCENARIO 2 – DUE FURGONI DA 150 KG
# ---------------------------------------------------------------------------

def giro_veicolo(clienti):
    """Il giro più corto di un furgone che serve il gruppo di clienti indicato."""
    sequenza, km = miglior_giro(clienti)
    return {"sequenza": sequenza, "km": km, "kg": carico(clienti)}


def suddivisioni_in_due_gruppi(clienti):
    """
    Elenca tutti i modi di dividere i clienti tra i due furgoni,
    dando ad ognuno almeno un cliente.

    I due furgoni sono uguali, quindi dare {Edolo, Vione} al primo e
    {Malonno} al secondo è la stessa cosa del contrario. Per non contare
    ogni divisione due volte, il primo cliente va sempre sul furgone 1
    e si decide solo chi viaggia con lui. In tutto sono 15 divisioni.
    """
    primo, altri = clienti[0], clienti[1:]
    for quanti_compagni in range(len(altri) + 1):
        for compagni in combinations(altri, quanti_compagni):
            gruppo_1 = (primo,) + compagni
            gruppo_2 = tuple(c for c in clienti if c not in gruppo_1)
            if gruppo_2:  # se il furgone 2 non ha clienti, la divisione non serve
                yield gruppo_1, gruppo_2


def scenario_2():
    """
    Prova tutte le divisioni dei clienti tra i due furgoni. Scarta quelle
    in cui un furgone dovrebbe portare più di 150 kg; per le altre calcola
    il giro più corto di ciascun furgone e somma i km.

    Restituisce un dizionario con:
      migliore      la divisione con meno km in totale
      suddivisioni  quante divisioni sono state provate
      scartate      quante sono state scartate per il peso
      ammissibili   le divisioni valide, dalla più corta alla più lunga,
                    ciascuna come {"veicoli": [giro_1, giro_2], "km": totale}
                    (ogni giro è {"sequenza", "km", "kg"})
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
