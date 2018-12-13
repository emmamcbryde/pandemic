""" Read in OAGExcel for flight travel data to generate
a flight travel matrix.
"""

from __future__ import print_function
from pprint import pprint

import xlrd
import numpy
import pycountry

import data


def write_matrix_to_datajs(data_js_fname):
  """
    Resultant data written to data_js_fname: {
      'travel': [
        # i'th country
        [
          ['AUS', 33, 444],
          ...
        ],
        ...
      ],
      'series': [
        ['AUS', 333.],
        ...
      ],
      'countries': {
        'name': 'Australia',
        'coordinates': [333, 444],
        'id': '781',
        'population': 400000,
      }
    }
    """

  country_by_alpha2 = data.get_country_by_alpha2()
  population_by_id = data.get_population_by_id()
  matrix, alpha2_from_i = data.get_oag_flight_matrix()

  data.symmetrize_matrix(matrix)
  eig_values, eig_vectors = numpy.linalg.eig(matrix)

  n = len(alpha2_from_i)

  def get_country_from_i(i):
    return pycountry.countries.get(alpha_2=alpha2_from_i[i])

  country_travel = []
  for i in range(n):
    row = []
    for j in range(n):
      country = get_country_from_i(j)
      row.append(
          [country.alpha_3,
           matrix[i,
                  j],
           int(country.numeric)])
    country_travel.append(row)

  eigen = []
  for i in range(n):
    country = get_country_from_i(i)
    travel = int(eig_vectors[0][i] * eig_values[0])
    eigen.append([country.alpha_3, travel])

  countries = []
  for i in range(n):
    alpha_2 = alpha2_from_i[i]
    name = get_country_from_i(i).name
    if alpha_2 in country_by_alpha2:
      country = country_by_alpha2[alpha_2]
      coordinates = [
          float(country['Latitude (average)']),
          float(country['Longitude (average)'])
      ]
    else:
      coordinates = None
    id = int(country['Numeric code'])
    if id in population_by_id:
      population = population_by_id[id]
    else:
      population = None
    entry = {
        'name': name,
        'iso_n3': "%03d" % int(country['Numeric code']),
        'iso_a3': country['Alpha-3 code'],
    }
    print(entry)
    countries.append(entry)

  data.make_data_js(
      data_js_fname,
      {
          'travel': country_travel,
          'series': eigen,
          'countries': countries
      })


write_matrix_to_datajs('flight-data.js')
