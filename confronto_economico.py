"""
Project Work – Traccia 23
Confronto economico dei due scenari di consegna.

Usa i percorsi ottimi trovati da enumerazione_percorsi.py e calcola,
per ciascuno scenario, il costo giornaliero di un giro di consegne:

    C_totale = C_fisso_veicoli
             + km * (costo_carburante_per_km + altri_costi_per_km)
             + ore_autisti * costo_orario_autista

Poi analizza come cambia la convenienza al variare delle voci di costo.
Tutti gli importi sono in euro, IVA esclusa (l'impresa la detrae).

Lo stesso modello è riprodotto in JavaScript in js/modello.js,
così la pagina web può ricalcolarlo quando si spostano i cursori.

Uso:  python3 confronto_economico.py
"""

from enumerazione_percorsi import CLIENTI, carico, scenario_1, scenario_2

# ---------------------------------------------------------------------------
# 1. PARAMETRI DI COSTO (valori di riferimento, ottobre 2026)
# ---------------------------------------------------------------------------

# Gasolio self in Lombardia: 2,247 EUR/l IVA inclusa (MIMIT, 13/10/2026).
# Al netto dell'IVA al 22%: 2,247 / 1,22 = 1,84 EUR/l.
PREZZO_GASOLIO = round(2.247 / 1.22, 2)  # EUR/l

# Costo orario aziendale di un autista di furgone (CCNL Logistica,
# tabelle del Ministero del Lavoro 2026: da 22,64 a 30,27 EUR/h).
COSTO_ORARIO_AUTISTA = 25.0  # EUR/h

# Tempi operativi
VELOCITA_MEDIA = 50          # km/h, percorsi su strada statale (SS42) in Valle Camonica
TEMPO_SCARICO = 10           # minuti per ogni cliente
TEMPO_CARICO = 15            # minuti al deposito per ogni veicolo

# Giorni di consegna in un anno, per la proiezione annua
GIORNI_ANNO = 250

# Caratteristiche dei veicoli.
# Scenario 1: un furgone medio (portata utile ampiamente sopra 300 kg).
# Scenario 2: due furgoni compatti identici (portata limitata a 150 kg
# per ipotesi del modello, ad es. vani refrigerati di piccole dimensioni).
VEICOLI = {
    "furgone_medio": {
        "consumo_l_100km": 9.0,   # litri ogni 100 km
        "altri_costi_km": 0.08,   # pneumatici, manutenzione, usura (EUR/km)
        "costo_fisso_giorno": 35.0,  # ammortamento/leasing, assicurazione,
                                      # bollo, ripartiti su 22 giorni/mese
    },
    "furgone_compatto": {
        "consumo_l_100km": 6.5,
        "altri_costi_km": 0.06,
        "costo_fisso_giorno": 25.0,
    },
}

# Voci prodotte da costo_giro(), nell'ordine in cui vengono sommate
VOCI = ["km", "ore", "fisso", "carburante", "altri_km", "autista", "totale"]


# ---------------------------------------------------------------------------
# 2. CALCOLO DEI COSTI DI UN GIRO
# ---------------------------------------------------------------------------

def costo_giro(km, n_clienti, veicolo, prezzo_gasolio, costo_orario):
    """
    Costo e durata di un singolo veicolo che esegue un giro.
    Restituisce un dizionario con le chiavi elencate in VOCI.
    """
    caratteristiche = VEICOLI[veicolo]

    ore_guida = km / VELOCITA_MEDIA
    minuti_soste = n_clienti * TEMPO_SCARICO + TEMPO_CARICO
    ore = ore_guida + minuti_soste / 60

    litri = km * caratteristiche["consumo_l_100km"] / 100
    carburante = litri * prezzo_gasolio
    altri = km * caratteristiche["altri_costi_km"]
    autista = ore * costo_orario
    fisso = caratteristiche["costo_fisso_giorno"]

    return {
        "km": km,
        "ore": ore,
        "fisso": fisso,
        "carburante": carburante,
        "altri_km": altri,
        "autista": autista,
        "totale": fisso + carburante + altri + autista,
    }


def somma(giri):
    """Somma voce per voce i costi di più veicoli."""
    return {voce: sum(giro[voce] for giro in giri) for voce in VOCI}


def valuta_scenari(prezzo_gasolio=PREZZO_GASOLIO,
                   costo_orario=COSTO_ORARIO_AUTISTA):
    """
    Calcola i costi dei due scenari. Restituisce tre valori:
      costi_1      costi dello scenario 1 (un furgone medio)
      costi_2      costi dello scenario 2, sommati sui due furgoni compatti
      giri_2       costi dei due furgoni dello scenario 2, presi uno per uno

    In più, "durata" indica dopo quanto tempo tutte le consegne sono finite:
    nello scenario 2 i due furgoni viaggiano in parallelo, quindi conta
    il giro più lungo.
    """
    s1 = scenario_1()
    migliore_2 = scenario_2()["migliore"]

    costi_1 = costo_giro(s1["km"], len(s1["sequenza"]), "furgone_medio",
                         prezzo_gasolio, costo_orario)
    costi_1["durata"] = costi_1["ore"]

    giri_2 = [
        costo_giro(giro["km"], len(giro["sequenza"]), "furgone_compatto",
                   prezzo_gasolio, costo_orario)
        for giro in migliore_2["veicoli"]
    ]
    costi_2 = somma(giri_2)
    costi_2["durata"] = max(giro["ore"] for giro in giri_2)

    return costi_1, costi_2, giri_2


# ---------------------------------------------------------------------------
# 3. ANALISI DI SENSIBILITÀ E PUNTI DI PAREGGIO
# ---------------------------------------------------------------------------

def differenza(**parametri):
    """Costo scenario 2 meno costo scenario 1 (positivo = conviene il 1)."""
    costi_1, costi_2, _ = valuta_scenari(**parametri)
    return costi_2["totale"] - costi_1["totale"]


def pareggio_costo_fisso_medio():
    """
    Costo fisso giornaliero del furgone medio oltre il quale
    diventa conveniente lo scenario 2 (a parità delle altre voci).

    Il costo fisso si somma al totale dello scenario 1 senza influire
    su nient'altro: basta quindi aumentarlo esattamente della differenza
    attuale tra i due scenari.
    """
    return VEICOLI["furgone_medio"]["costo_fisso_giorno"] + differenza()


# ---------------------------------------------------------------------------
# 4. STAMPA DEI RISULTATI
# ---------------------------------------------------------------------------

def hhmm(ore):
    """Ore decimali in testo: 1.75 -> "1h 45min"."""
    h = int(ore)
    m = round((ore - h) * 60)
    if m == 60:  # es. 1.999 ore: 60 minuti diventano un'ora in più
        h, m = h + 1, 0
    return f"{h}h {m:02d}min"


def eur(x):
    return f"{x:8.2f} EUR"


def stampa_parametri():
    print("PARAMETRI")
    print(f"  Gasolio (netto IVA):   {PREZZO_GASOLIO:.2f} EUR/l")
    print(f"  Costo autista:         {COSTO_ORARIO_AUTISTA:.2f} EUR/h")
    print(f"  Velocità media:        {VELOCITA_MEDIA} km/h")
    print(f"  Scarico / carico:      {TEMPO_SCARICO} / {TEMPO_CARICO} min\n")


def stampa_tabella_costi(costi_1, costi_2):
    print(f"{'Voce':<26}{'Scenario 1':>14}{'Scenario 2':>14}{'Diff.':>12}")
    righe = [
        # (etichetta, voce, funzione di formattazione)
        ("Km percorsi", "km", lambda x: f"{x:.1f} km"),
        ("Ore di lavoro autisti", "ore", hhmm),
        ("Costi fissi veicoli", "fisso", eur),
        ("Carburante", "carburante", eur),
        ("Usura e manutenzione", "altri_km", eur),
        ("Costo autisti", "autista", eur),
        ("TOTALE GIORNALIERO", "totale", eur),
    ]
    for etichetta, voce, formatta in righe:
        diff = costi_2[voce] - costi_1[voce]
        testo_diff = hhmm(diff) if voce == "ore" else f"{diff:+.2f}"
        print(f"{etichetta:<26}{formatta(costi_1[voce]):>14}"
              f"{formatta(costi_2[voce]):>14}{testo_diff:>12}")
    print(f"{'Fine consegne dopo':<26}{hhmm(costi_1['durata']):>14}"
          f"{hhmm(costi_2['durata']):>14}")


def stampa_dettaglio_scenario_2(giri_2):
    print("\nDettaglio scenario 2")
    for numero, giro in enumerate(giri_2, start=1):
        print(f"  Veicolo {numero}: {giro['km']:.1f} km, {hhmm(giro['ore'])}, "
              f"{giro['totale']:.2f} EUR")


def stampa_costo_per_kg(costi_1, costi_2):
    kg = carico(CLIENTI)  # kg consegnati in un giorno (uguale nei due scenari)
    print(f"\nCosto per kg consegnato: scenario 1 {costi_1['totale']/kg:.3f} EUR/kg, "
          f"scenario 2 {costi_2['totale']/kg:.3f} EUR/kg")


def stampa_sensibilita(titolo, nome_parametro, valori, formatta):
    """Ricalcola i due scenari cambiando un solo parametro alla volta."""
    print(f"\nSENSIBILITÀ – {titolo}")
    for valore in valori:
        costi_1, costi_2, _ = valuta_scenari(**{nome_parametro: valore})
        tot_1, tot_2 = costi_1["totale"], costi_2["totale"]
        print(f"  {formatta(valore)}  S1 {tot_1:7.2f}  S2 {tot_2:7.2f}"
              f"  diff {tot_2 - tot_1:+6.2f}")


def stampa_proiezione_annua(costi_1, costi_2):
    print(f"\nPROIEZIONE ANNUA ({GIORNI_ANNO} giorni di consegna)")
    print(f"  Scenario 1: {costi_1['totale'] * GIORNI_ANNO:,.0f} EUR")
    print(f"  Scenario 2: {costi_2['totale'] * GIORNI_ANNO:,.0f} EUR")
    risparmio = (costi_2["totale"] - costi_1["totale"]) * GIORNI_ANNO
    print(f"  Risparmio scegliendo lo scenario 1: {risparmio:,.0f} EUR")


def stampa():
    costi_1, costi_2, giri_2 = valuta_scenari()

    stampa_parametri()
    stampa_tabella_costi(costi_1, costi_2)
    stampa_dettaglio_scenario_2(giri_2)
    stampa_costo_per_kg(costi_1, costi_2)

    stampa_sensibilita(
        "prezzo del gasolio (netto IVA)", "prezzo_gasolio",
        [1.50, 1.70, PREZZO_GASOLIO, 2.00, 2.20],
        lambda p: f"{p:.2f} EUR/l",
    )
    stampa_sensibilita(
        "costo orario autista", "costo_orario",
        [20, 22.64, 25, 30.27, 35],  # 22,64 e 30,27: estremi delle tabelle ministeriali
        lambda h: f"{h:5.2f} EUR/h",
    )

    print("\nPUNTO DI PAREGGIO")
    print(f"  Lo scenario 2 diventa conveniente se il costo fisso del furgone"
          f" medio supera {pareggio_costo_fisso_medio():.2f} EUR/giorno")

    stampa_proiezione_annua(costi_1, costi_2)


if __name__ == "__main__":
    stampa()
