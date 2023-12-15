# IOI Seminar II - Instrumental

Repozitorij vsebuje kodo aplikacije, za igranje glasbil z uporabo spletne kamere.

## Navodila za postavitev in uporabo projekta

Najprej poženemo sledeči ukaz, da se naložijo vse potrebne knjižnice: ```npm install```.

Ko so vse knjižnice naložene lahko zaženemo še ukaz ```npm run serve```, s katerim poskrbimo da GUI postane dostopen na
naslovu `http://localhost:8080/`.

#### Pomembno:

Za ustrezno delovanje aplikacije je potrebno, da v ozadju teče še strežnik, ki ga dobimo na
naslovu https://github.com/anzeo/IOI_Seminar_II_PTModel. Na strežniku je dostopen API endpoint, ki ga aplikacija kliče,
zato da dobi natreniran model za prepoznavo uporabnikovih gest z roko, pri igranju glasbil.

## Uporabniški vmesnik

Izbiramo lahko med igranjem več glasbil. Glasbilo izberemo s številko na tipkovnici, in sicer:

- `1` - klavir
- `2` - citre

Na obe glasbili igramo tako, da se s pomočjo kamere pomikamo čez tipke/strune in ko želimo nanje zaigrat damo kazalec
v pokrčen položaj (s tem simuliramo pritiskanje tipke).

Zaznavanje položaja kazalca je podprto z natreniranim modelom (ki loči med tem ali je prst pokrčen ali ne). V primeru,
da zaznavanje ne deluje dobro lahko ta model po želji natreniramo na novo, če pritisnemo tipko `R`. **Pri tem mora za
uspešno treniranje v ozadju teči [prej omenjeni strežnik](#pomembno).**


