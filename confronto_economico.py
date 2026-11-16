"""
Calcola quanto costa ogni giorno ciascuno dei due modi di fare le consegne,
e quale conviene.

Prende i giri più corti trovati da enumerazione_percorsi.py e, per ognuno,
somma quattro voci di costo:

    costo del giorno = costo fisso dei furgoni (leasing, assicurazione, bollo)
                     + carburante
                     + usura e manutenzione (gomme, tagliandi)
                     + stipendio degli autisti per le ore di lavoro

Poi mostra cosa succede se cambiano il prezzo del gasolio o il costo
degli autisti. Tutti gli importi sono in euro, senza IVA, perché l'impresa
la recupera.

Gli stessi calcoli sono ripetuti in js/modello.js, così la pagina web può
rifarli subito quando si spostano i cursori.

Per avviarlo:  python3 confronto_economico.py
"""

from enumerazione_percorsi import CLIENTI, carico, scenario_1, scenario_2

# ---------------------------------------------------------------------------
# 1. PARAMETRI DI COSTO (valori di riferimento, ottobre 2026)
# ---------------------------------------------------------------------------

# Prezzo del gasolio al distributore self in Lombardia: 2,247 €/l con IVA
# (dato del Ministero, MIMIT, 13/10/2026). Togliendo l'IVA del 22%:
# 2,247 / 1,22 = 1,84 €/l.
PREZZO_GASOLIO = round(2.247 / 1.22, 2)  # €/l

# Quanto costa all'impresa un'ora di lavoro di un autista di furgone.
# Le tabelle del Ministero del Lavoro 2026 vanno da 22,64 a 30,27 €/h.
COSTO_ORARIO_AUTISTA = 25.0  # €/h

# Tempi di lavoro
VELOCITA_MEDIA = 50   # km/h, strada statale SS42 in Valle Camonica
TEMPO_SCARICO = 10    # minuti per scaricare la merce da ogni cliente
TEMPO_CARICO = 15     # minuti per caricare ogni furgone al deposito

# Giorni di consegna in un anno, per calcolare il costo annuale
GIORNI_ANNO = 250

# I due tipi di furgone.
# Scenario 1: un furgone medio, che porta molto più di 300 kg.
# Scenario 2: due furgoni compatti uguali. Si suppone che portino al massimo
# 150 kg ciascuno, ad esempio perché hanno un piccolo vano frigorifero.
VEICOLI = {
    "furgone_medio": {
        "consumo_l_100km": 9.0,   # litri di gasolio ogni 100 km
        "altri_costi_km": 0.08,   # gomme, manutenzione e usura, in € per km
        "costo_fisso_giorno": 35.0,  # leasing, assicurazione e bollo,
                                      # divisi per 22 giorni lavorativi al mese
    },
    "furgone_compatto": {
        "consumo_l_100km": 6.5,
        "altri_costi_km": 0.06,
        "costo_fisso_giorno": 25.0,
    },
}

# I valori calcolati da costo_giro() per ogni furgone
VOCI =["km", "ore", "fisso", "carburante", "altri_km", "autista", "totale"]


# ---------------------------------------------------------------------------
# 2. CALCOLO DEI COSTI DI UN GIRO
# ---------------------------------------------------------------------------

def costo_giro(km, n_clienti, veicolo, prezzo_gasolio, costo_orario):
    """
    Quanto costa e quanto dura il giro di un singolo furgone.
    Restituisce un dizionario con i valori elencati in VOCI.
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
    """Somma i costi di più furgoni, una voce alla volta."""
    return {voce: sum(giro[voce] for giro in giri) for voce in VOCI}


def valuta_scenari(prezzo_gasolio=PREZZO_GASOLIO,
                   costo_orario=COSTO_ORARIO_AUTISTA):
    """
    Calcola i costi dei due scenari. Restituisce tre risultati:
      costi_1   lo scenario 1 (un furgone medio)
      costi_2   lo scenario 2, sommando i due furgoni compatti
      giri_2    i due furgoni dello scenario 2, ciascuno per conto suo

    "durata" dice dopo quanto tempo tutte le consegne sono finite.
    Nello scenario 2 i due furgoni partono insieme, quindi si finisce
    quando torna quello con il giro più lungo.
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
# 3. COSA CAMBIA SE CAMBIANO I COSTI
# ---------------------------------------------------------------------------

def differenza(**parametri):
    """
    Quanto costa in più lo scenario 2 rispetto allo scenario 1.
    Se il risultato è positivo conviene lo scenario 1, se è negativo il 2.
    """
    costi_1, costi_2, _ = valuta_scenari(**parametri)
    return costi_2["totale"] - costi_1["totale"]


def pareggio_costo_fisso_medio():
    """
    Fino a quanto può salire il costo fisso giornaliero del furgone medio
    prima che i due furgoni piccoli diventino più convenienti
    (lasciando invariati tutti gli altri costi).

    Il costo fisso si aggiunge al totale dello scenario 1 e non cambia
    nient'altro, quindi basta sommargli la differenza di oggi tra i due
    scenari: a quel punto i costi sono uguali.
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
    """Importo in euro allineato a destra: 98.39 -> "   98.39 EUR"."""
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
    kg = carico(CLIENTI)  # kg consegnati in un giorno, uguali nei due scenari
    print(f"\nCosto per kg consegnato: scenario 1 {costi_1['totale']/kg:.3f} EUR/kg, "
          f"scenario 2 {costi_2['totale']/kg:.3f} EUR/kg")


def stampa_sensibilita(titolo, nome_parametro, valori, formatta):
    """Rifà il calcolo con diversi valori di un solo costo, lasciando fermi gli altri."""
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
        [20, 22.64, 25, 30.27, 35],  # 22,64 e 30,27: minimo e massimo delle tabelle del Ministero
        lambda h: f"{h:5.2f} EUR/h",
    )

    print("\nPUNTO DI PAREGGIO")
    print(f"  Lo scenario 2 diventa conveniente se il costo fisso del furgone"
          f" medio supera {pareggio_costo_fisso_medio():.2f} EUR/giorno")

    stampa_proiezione_annua(costi_1, costi_2)


if __name__ == "__main__":
    stampa()
