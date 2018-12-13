import data
import pprint

entries = data.get_countryinfo()
entries2 = data.get_countrylist()

country_by_alpha2 = {e['Alpha-3 code']: e for e in entries2}

for entry in entries:
  if entry['ISO3'] in country_by_alpha2:
    entry.update(country_by_alpha2[entry['ISO3']])
  else:
    print("Fail to find [Lat, Long] for", entry['Country'])
pprint.pprint(entries, indent=2)
