# Prototipo ologramma Gatling Cinetica

Questa versione parte dal prototipo con le quattro carte Gatling approvate.

## Comportamento
- In modalità Classic, quando la Gatling Cinetica spara, viene mostrata una proiezione temporanea con geometria Three.js: piattaforma, torretta, gruppo canne rotanti, rinculo e colpi dalla bocca dell'arma.
- L'origine è individuata nello slot del giocatore o dell'avversario, usando il seme della carta arma. Il bersaglio è la barra HP della squadra opposta.
- L'ologramma scompare dopo circa 2,5 secondi. Il callback che applica i danni resta invariato.
- Il vecchio effetto Gatling è disattivato soltanto per `fxType === 'gatling'`; tutte le altre armi mantengono i propri effetti.
- Il modello è una ricostruzione 3D stilizzata a partire dal concetto Gatling, **non** una copia 3D identica delle illustrazioni della carta.

## File nuovi
- `src/gatlingHologram.js`
- `src/gatlingHologram.css`

## File modificato
- `src/weaponEffects.js`

## Verifica
- Sintassi JS dei due file verificata con `node --check`.
- ZIP verificato integro.
- **Build non completata:** `npm ci --offline` fallisce per il pacchetto `yargs-parser` non disponibile nella cache; verificare avvio e rendering WebGL su StackBlitz.
- Il prototipo richiede che la carta effettivamente usata abbia `fxType: 'gatling'`.
